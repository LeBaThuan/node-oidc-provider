const { InvalidRequest } = require('../../helpers/errors');
const dpopValidate = require('../../helpers/validate_dpop');
const epochTime = require('../../helpers/epoch_time');

/*
 * Validates dpop_jkt equals the used DPoP proof thumbprint
 * when provided, otherwise defaults dpop_jkt to it.
 *
 * @throws: invalid_request
 */
module.exports = async function checkDpopJkt(ctx, next) {
  const { params } = ctx.oidc;

  const dPoP = await dpopValidate(ctx);
  if (dPoP) {
    const { ReplayDetection } = ctx.oidc.provider;
    const unique = await ReplayDetection.unique(
      ctx.oidc.client.clientId,
      dPoP.jti,
      epochTime() + 60,
    );

    ctx.assert(unique, new InvalidRequest('DPoP proof JWT Replay detected'));

    if (params.dpop_jkt && params.dpop_jkt !== dPoP.thumbprint) {
      throw new InvalidRequest('DPoP proof key thumbprint does not match dpop_jkt');
    } else if (!params.dpop_jkt) {
      params.dpop_jkt = dPoP.thumbprint;
    }
  }

  return next();
};