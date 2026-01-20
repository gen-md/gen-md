export interface GenMdFile {
  filePath: string;
  frontmatter: GenMdFrontmatter;
  body: string;
  raw: string;
}

export interface GenMdFrontmatter {
  name?: string;
  description?: string;
  context?: string[];
  skills?: string[];
  prompt?: string;
  output?: string;
  [key: string]: unknown;
}

export interface ParsedGenMd {
  frontmatter: GenMdFrontmatter;
  body: string;
  isValid: boolean;
  errors: string[];
}

export interface GitHubContext {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}
