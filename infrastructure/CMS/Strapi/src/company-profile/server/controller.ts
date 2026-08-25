import { geocodeSearch } from './geocoding';
import { HttpCtx, sendError } from './httpErrors';
import type { CompanyProfileCmsService } from './service';

/** Construye los handlers Koa (admin) que delegan en el servicio de orquestación. */
export function createControllers(service: CompanyProfileCmsService) {
  const body = (ctx: HttpCtx): Record<string, unknown> =>
    (ctx.request?.body ?? {}) as Record<string, unknown>;

  const run = async (ctx: HttpCtx, fn: () => Promise<unknown>): Promise<void> => {
    try {
      ctx.body = { data: await fn() };
    } catch (error) {
      sendError(ctx, error);
    }
  };

  // Tras un DELETE devolvemos la vista fresca para que la UI re-renderice.
  const afterDelete = async (ctx: HttpCtx, del: () => Promise<void>): Promise<void> =>
    run(ctx, async () => {
      await del();
      return service.getInformacionGeneral();
    });

  return {
    getInformacionGeneral: (ctx: HttpCtx) => run(ctx, () => service.getInformacionGeneral()),

    initialize: (ctx: HttpCtx) => run(ctx, () => service.initialize(body(ctx).recipientEmail)),
    setRecipientEmail: (ctx: HttpCtx) => run(ctx, () => service.setRecipientEmail(body(ctx).recipientEmail)),

    addPhone: (ctx: HttpCtx) => run(ctx, () => service.addPhone(body(ctx).number)),
    updatePhone: (ctx: HttpCtx) => run(ctx, () => service.updatePhone(ctx.params?.id ?? '', body(ctx).number)),
    deletePhone: (ctx: HttpCtx) => afterDelete(ctx, () => service.deletePhone(ctx.params?.id ?? '')),

    addEmail: (ctx: HttpCtx) => run(ctx, () => service.addEmail(body(ctx).address)),
    updateEmail: (ctx: HttpCtx) => run(ctx, () => service.updateEmail(ctx.params?.id ?? '', body(ctx).address)),
    deleteEmail: (ctx: HttpCtx) => afterDelete(ctx, () => service.deleteEmail(ctx.params?.id ?? '')),

    addSocialLink: (ctx: HttpCtx) => run(ctx, () => service.addSocialLink(body(ctx).network, body(ctx).url)),
    updateSocialLink: (ctx: HttpCtx) =>
      run(ctx, () => service.updateSocialLink(ctx.params?.id ?? '', body(ctx).network, body(ctx).url)),
    deleteSocialLink: (ctx: HttpCtx) => afterDelete(ctx, () => service.deleteSocialLink(ctx.params?.id ?? '')),

    addLocation: (ctx: HttpCtx) =>
      run(ctx, () => service.addLocation(body(ctx).address, body(ctx).latitude, body(ctx).longitude)),
    updateLocation: (ctx: HttpCtx) =>
      run(ctx, () => service.updateLocation(body(ctx).address, body(ctx).latitude, body(ctx).longitude)),
    deleteLocation: (ctx: HttpCtx) => afterDelete(ctx, () => service.deleteLocation()),

    geocode: (ctx: HttpCtx) => run(ctx, () => geocodeSearch(String(ctx.query?.q ?? ''))),
  };
}

export type CompanyProfileControllers = ReturnType<typeof createControllers>;
