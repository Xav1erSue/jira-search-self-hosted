import fetch, { FetchError, Response } from "node-fetch";
import https from "https";
import { JiraFetchOptions } from "./types";
import { jiraUrl, preference, throwIfResponseNotOkay } from "./utils";
import { LocalStorage } from "@raycast/api";

const COOKIE_STORAGE_KEY = "JIRA_COOKIE";

/**
 * Fetches a response from Jira or throws an exception if the request fails or returns a non-okay status code.
 * @param path the Jira path (without domain) to fetch
 * @param params an object defining the query params to request
 * @param statusErrors define custom error texts for response status codes to be thrown
 * @throws if the response's status code is not okay
 * @return the jira response
 */
export async function jiraFetch(path: string, options?: JiraFetchOptions, isRetry = false): Promise<Response> {
  const { method = "GET", params = {}, body, statusErrors } = options ?? {};

  try {
    const route = path.startsWith("/") ? path.substring(1) : path;

    const searchParams = new URLSearchParams(params);

    const url = `${jiraUrl}/${route}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        cookie: (await LocalStorage.getItem(COOKIE_STORAGE_KEY)) ?? "",
      },
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log(`[${response.status} ${method}]: ${response.url}`);

    // 鉴权失败，自动重新登录
    if (response.status === 401 && !isRetry) {
      const res = await jiraFetch("/rest/auth/1/session", {
        method: "POST",
        body: {
          username: preference.username,
          password: preference.password,
        },
      });

      const session = (await res.json()) as { session: { name: string; value: string } };

      const cookie = session.session.name + "=" + session.session.value;

      LocalStorage.setItem(COOKIE_STORAGE_KEY, cookie);

      return jiraFetch(path, options, true);
    }

    throwIfResponseNotOkay(response, statusErrors);
    return response;
  } catch (error) {
    if (error instanceof FetchError) throw Error("Check your network connection");
    else throw error;
  }
}

/**
 * Fetches a JSON object of type `Result` or throws an exception if the request fails or returns a non-okay status code.
 * @param path the Jira path (without domain) to fetch
 * @param params an object defining the query params to request
 * @param statusErrors define custom error texts for response status codes to be thrown
 * @throws if the response's status code is not okay
 * @return the jira response
 */
export async function jiraFetchObject<Result>(path: string, options?: JiraFetchOptions): Promise<Result> {
  const response = await jiraFetch(path, options);

  return (await response.json()) as unknown as Result;
}

export * from "./types";
export * from "./utils";
export * from "./exception";
