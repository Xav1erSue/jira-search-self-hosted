import path from "path";
import { environment, showToast, Image, Toast } from "@raycast/api";
import { promises as fs } from "fs";
import { jiraFetch, Warning } from "./api";

interface ImageSpec {
  urlPath: string;
  imageType: string;
  key: string;
}

const imageDir = path.join(environment.supportPath, "image");

async function isFile(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.isFile();
  } catch (err) {
    return false;
  }
}

function filePath(image: ImageSpec): string {
  return path.join(imageDir, image.imageType, `${image.key}.png`);
}

async function downloadImage(image: ImageSpec, filePath: string): Promise<string> {
  const { dir } = path.parse(filePath);
  await fs.mkdir(dir, { recursive: true });
  const response = await jiraFetch(image.urlPath);
  const body = await response.arrayBuffer();
  await fs.writeFile(filePath, new DataView(body));
  return filePath;
}

function parseImageUrl(url: string): ImageSpec {
  type UrlMatcher = {
    pattern: RegExp;
    spec: (matchGroup: { [p: string]: string }) => ImageSpec;
  };
  const matcher: UrlMatcher[] = [
    {
      pattern: /.*\/universal_avatar\/view\/type\/(?<imageType>[a-z]+)\/avatar\/(?<key>[0-9]+)/i,
      spec: (g) => ({
        urlPath: `rest/api/3/universal_avatar/view/type/${g.imageType}/avatar/${g.key}?format=png&size=medium`,
        imageType: g.imageType,
        key: g.key,
      }),
    },
    {
      pattern: /\/images\/icons\/(?<imageType>[a-z]+)\/(?<key>[a-z.]+)/i,
      spec: (g) => ({
        urlPath: `images/icons/${g.imageType}/${g.key}?format=png&size=medium`,
        imageType: g.imageType,
        key: g.key,
      }),
    },
    {
      pattern: /\/secure\/viewavatar\?size=(?<size>[a-z]+)&avatarId=(?<key>\d+)&avatarType=(?<imageType>[a-z]+)/i,
      spec: (g) => ({
        urlPath: url, // 使用原始 URL，而不是构造新的
        imageType: g.imageType,
        key: g.key,
      }),
    },
  ];

  for (const m of matcher) {
    const match = url.match(m.pattern);
    if (match && match.groups) {
      return m.spec(match.groups);
    }
  }

  throw new Warning(`Unexpected icon path ${url}`);
}

export async function jiraImage(url: string): Promise<Image.ImageLike | undefined> {
  try {
    const imageSpec = parseImageUrl(url);
    const path = filePath(imageSpec);
    const isAvailable = await isFile(path);
    if (isAvailable) {
      return path;
    } else {
      return await downloadImage(imageSpec, path);
    }
  } catch (e) {
    if (e instanceof Warning) {
      console.warn(e);
      return url; // 直接返回原始 URL，不再递归调用
    } else {
      console.error(e);
      await showToast({
        style: Toast.Style.Failure,
        title: "获取 Jira 图标失败",
        message: e instanceof Error ? e.message : undefined,
      });
      return undefined;
    }
  }
}

export default async function ClearImageCache() {
  await fs.rm(imageDir, { force: true, recursive: true });
  await showToast({
    style: Toast.Style.Success,
    title: "Image Cache cleared",
    message: "Image will be reloaded on next search",
  });
}
