import { Response } from "node-fetch";
import { PresentableError } from "./exception";
import { PreferenceValue, StatusErrors } from "./types";
import { getPreferenceValues } from "@raycast/api";

export const preference: PreferenceValue = getPreferenceValues();

export const jiraUrl = preference.baseURL;

const DEFAULT_STATUS_ERRORS: StatusErrors = {
  401: new PresentableError("Jira Error", "鉴权失败，请检查用户名和密码是否正确"),
};

export const throwIfResponseNotOkay = async (response: Response, statusErrors?: StatusErrors) => {
  if (!response.ok) {
    const status = response.status;
    const exactStatusError = statusErrors?.[status] || DEFAULT_STATUS_ERRORS[status];
    if (exactStatusError) throw new PresentableError(exactStatusError.name, exactStatusError.message);
    else if (status >= 500) throw new PresentableError("Jira Error", `Server error ${status}`);
    else throw new PresentableError("Jira Error", `Request error ${status}`);
  }
};
