/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * The Request Object used for Invoking OpenWhisk
 */
export type RawRequest = {
  /**
   * The headers of the request made to OpenWhisk (or Simulator)
   */
  headers?: {
    /**
     * OpenWhisk Activation ID
     */
    "x-openwhisk-activation-id"?: string;
    /**
     * Request ID generated by OpenWhisk
     */
    "x-request-id"?: string;
    /**
     * Request ID generated by the CDN
     */
    "x-cdn-request-id"?: string;
    /**
     * Name of the Backend handling the request.
     */
    "x-backend-name"?: string;
    [k: string]: string;
  };
  /**
   * The HTTP method of the request made to OpenWhisk (or Simulator). Note: OpenWhisk converts all methods to lowercase.
   */
  method?: string;
  /**
   * Parameters used to invoke the OpenWhisk action. These are either URL parameters added when invoking the action from the CDN or default parameters set during creation of the action.
   */
  params?: {
    /**
     * Owner of the GitHub repository. This is the name of a user or organization.
     */
    owner?: string;
    /**
     * Repository where content originates
     */
    repo?: string;
    /**
     * Name of the branch or tag or the SHA of the commit
     */
    ref?: string;
    /**
     * Name of the branch or tag. defaults back to the value of 'ref' if missing.
     */
    branch?: string;
    /**
     * Path to the requested (Markdown) file
     */
    path?: string;
    /**
     * The request root path of the current strain.
     */
    rootPath?: string;
    /**
     * The resolved strain (variant)
     */
    strain?: string;
    /**
     * Deprecated: The original OpenWhisk request headers
     */
    __ow_headers?: {
      [k: string]: any;
    };
    /**
     * All other parameters are interpreted as string.
     */
    [k: string]: string;
  };
};

/**
 * Tracks the OpenWhisk action invocation
 */
export interface Action {
  request?: RawRequest;
  /**
   * A helix-log [SimpleInterface](https://github.com/adobe/helix-log) logger instance.
   */
  logger?: {
    [k: string]: any;
  };
  /**
   * Internal information related to debugging.
   */
  debug?: {
    [k: string]: any;
  };
  secrets?: Secrets;
  /**
   * A VDOMTransformer instance
   */
  transformer?: {
    [k: string]: any;
  };
  /**
   * A Downloader instance
   */
  downloader?: {
    [k: string]: any;
  };
  /**
   * A [markup configuration](https://github.com/adobe/helix-shared/blob/master/docs/markup.md)
   */
  markupconfig?: {
    [k: string]: any;
  };
}
/**
 * Secrets passed into the pipeline such as API Keys or configuration settings.
 */
export interface Secrets {
  /**
   * The Base URL for retrieving raw text files from GitHub
   */
  REPO_RAW_ROOT?: string;
  /**
   * The base URL for all GitHub API operations
   */
  REPO_API_ROOT?: string;
  /**
   * Comma-separated list of allowed hostnames for embeds. Supports `*.example.com` as a subdomain wildcard. Use `*` to allow all embeds (potentially insecure and conflicting with `DATA_EMBED_WHITELIST`)
   */
  EMBED_WHITELIST?: string;
  /**
   * Comma-separated list of allowed hostnames for data embeds. Supports `*.example.com` as a subdomain wildcard. Use `*` to allow all embeds (potentially insecure and conflicting with `EMBED_WHITELIST`)
   */
  DATA_EMBED_WHITELIST?: string;
  /**
   * URL of an Embed Service that takes the appended URL and returns an embeddable HTML representation.
   */
  EMBED_SERVICE?: string;
  /**
   * URL of a DataEmbed Service that takes the appended URL and returns an iterable JSON representation.
   */
  DATA_EMBED_SERVICE?: string;
  /**
   * Selector to be used when resolving internal embeds.
   */
  EMBED_SELECTOR?: string;
  /**
   * Minimum physical width of responsive images to generate
   */
  IMAGES_MIN_SIZE?: number;
  /**
   * Timeout for outgoing HTTP requests in milliseconds
   */
  HTTP_TIMEOUT?: number;
  TEST_BOOLEAN?: boolean;
  /**
   * Print XML with line breaks and indentation
   */
  XML_PRETTY?: boolean;
  /**
   * Sanitize the HTML output to guard against XSS attacks.
   *
   * **Note:** this flag applies a pretty aggressive DOM filtering that will strip out a lot of HTML that your authors might find useful. The setting is meant for processing truly untrusted inputs, such as comments in a social media site.
   */
  SANITIZE_DOM?: boolean;
  /**
   * API endpoint or action name to the service that resolves github refs to commit SHAs.
   */
  RESOLVE_GITREF_SERVICE?: string;
  /**
   * GitHub access token to use while fetching markdown. See https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line.
   */
  GITHUB_TOKEN?: string;
  /**
   * This interface was referenced by `Secrets`'s JSON-Schema definition
   * via the `patternProperty` "[A-Z0-9_]+".
   */
  [k: string]: boolean | number | string;
}
