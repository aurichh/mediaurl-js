import { testCache } from "@mediaurl/test-utils";
import { ALLOWED_ENV_VARS_MAP, SqlCache } from "../src";

let tested = false;
for (const key of Object.keys(ALLOWED_ENV_VARS_MAP)) {
  const url = <string>process.env[key];
  if (url) {
    tested = true;
    const type = ALLOWED_ENV_VARS_MAP[key];
    testCache(
      type,
      () =>
        new SqlCache({
          type,
          url,
          name: String(Math.random()),
        })
    );
  }
}

if (!tested) {
  describe("SqlCache", () => {
    test("noop", () => {});
  });
}