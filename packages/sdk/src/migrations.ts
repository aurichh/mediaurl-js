import {
  Addon,
  AddonRequest,
  AddonResponse,
  CatalogRequest,
  CatalogResponse,
  ItemRequest,
  SourceRequest,
  SubtitleRequest,
} from "@mediaurl/schema";
import semver from "semver";
import { AddonClass } from "./addon";
import { ActionHandlerContext } from "./types";

const sdkVersion: string = require("../package.json").version;

export type MigrationContext = {
  addon: AddonClass;
  data: any;
  user: ActionHandlerContext["user"];
  validator: {
    request: (obj: any) => any;
    response: (obj: any) => any;
  };
};

export const migrations = {
  addon: {
    response(
      ctx: MigrationContext,
      input: AddonRequest,
      output: AddonResponse
    ) {
      let addon = <Addon>output;
      if ((<any>addon).type !== "server") {
        if ((<any>addon).requestArgs) {
          throw new Error(
            `DEPRECATION: The addon property "requestArgs" was renamed to "triggers"`
          );
        }
        addon = ctx.validator.response(addon);
        (<any>addon).sdkVersion = sdkVersion;
        if (
          addon.triggers &&
          (!ctx.user?.app?.version ||
            !ctx.user?.app?.name ||
            (ctx.user.app.name === "watched" &&
              semver.lt("1.1.3", ctx.user.app.version)) ||
            (ctx.user.app.name === "rokkr" &&
              semver.lt("1.1.3", ctx.user.app.version)))
        ) {
          (<any>addon).requestArgs = addon.triggers;
        }
        if (
          addon.pages?.length &&
          (!ctx.user?.app?.version || semver.lt("1.8.0", ctx.user.app.version))
        ) {
          if (!addon.pages[0]?.dashboards) {
            throw new Error(
              `Legacy app version ${ctx.user?.app?.version} requires predefined dashboards on first page`
            );
          }
          (<any>addon).dashboards = addon.pages[0].dashboards;
        }
        output = addon;
      }
      return output;
    },
  },
  catalog: {
    request(ctx: MigrationContext, input: CatalogRequest) {
      if (input.page !== undefined && input.cursor === undefined) {
        console.warn("Upgrading catalog request from page to cursor system");
        ctx.data.update = 1;
        (<any>input).cursor = input.page === 1 ? null : input.page;
      }
      return ctx.validator.request(input);
    },
    response(
      ctx: MigrationContext,
      input: CatalogRequest,
      output: CatalogResponse
    ) {
      if (ctx.data.update === 1) {
        const o = <CatalogResponse>output;
        (<any>o).hasMore = o.nextCursor !== null;
      }
      return ctx.validator.response(output);
    },
  },
  item: {
    request(ctx: MigrationContext, input: ItemRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
  source: {
    request(ctx: MigrationContext, input: SourceRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
  subtitle: {
    request(ctx: MigrationContext, input: SubtitleRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
};
