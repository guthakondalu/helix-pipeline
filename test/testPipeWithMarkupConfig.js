/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
const assert = require('assert');
const { logging } = require('@adobe/helix-testutils');
const nock = require('nock');
const { pipe } = require('../src/defaults/html.pipe.js');
const coerce = require('../src/utils/coerce-secrets');
const Downloader = require('../src/utils/Downloader.js');

const TEST_MARKUP_CONFIG_URL = `
version: 1
markup:
  foo:
    match: (.*)/hello.md
    classnames: bar
    attribute:
      baz: qux
    wrap: .corge
    type: url
`;
const TEST_MARKUP_CONFIG_MD = `
version: 1
markup:
  foo:
    match: paragraph
    classnames: bar
    attribute:
      baz: qux
    wrap: .corge
    type: markdown
`;
const TEST_MARKUP_CONFIG_HTML = `
version: 1
markup:
  foo:
    match: p
    classnames: bar
    attribute:
      baz: qux
    wrap: .corge
    type: html
`;
const TEST_MARKUP_CONFIG_CONTENT = `
version: 1
markup:
  foo:
    match: ^heading + paragraph
    classnames: bar
    attribute:
      baz: qux
    wrap: .corge
    type: content
`;

function cleanup(html) {
  return html.replace(/\n\s*/g, '').trim();
}

function expectBodyEquals(result, expectedMarkup) {
  assert.equal(result.error, undefined);
  assert.equal(cleanup(result.response.body), cleanup(expectedMarkup));
  assert.notEqual(result.response.status, 500);
}

describe('Testing HTML Pipeline with markup config', () => {
  let action;
  let context;
  let logger;

  afterEach(() => {
    nock.restore();
  });

  beforeEach(() => {
    logger = logging.createTestLogger({
      // tune this for debugging
      level: 'info',
    });
    context = {
      request: {
        path: '/adobe/test-repo/master/hello.md',
      },
    };
    action = coerce({
      request: {
        headers: {
          'Cache-Control': 'no-store',
          'x-request-id': '1234',
        },
        params: {
          path: '/hello.md',
          owner: 'adobe',
          repo: 'test-repo',
          ref: 'master',
        },
      },
      secrets: {},
      logger,
    });
    nock.restore();
    nock.activate();
    nock.cleanAll();
  });

  it('html.pipe does not touch output if there is no markup config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [404, 'Not Found']);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n\n---\n\n# Bar']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<div>
        <h1 id="hello">Hello</h1>
        <p>from github.</p>
      </div>
      <div>
        <h1 id="bar">Bar</h1>
      </div>`);
  });

  it('html.pipe adjusts the MDAST as per markup url config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [200, TEST_MARKUP_CONFIG_URL]);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n\n---\n\n# Bar']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<div class="corge">
        <div class="bar" baz="qux">
          <div>
            <h1 id="hello">Hello</h1>
            <p>from github.</p>
          </div>
          <div>
            <h1 id="bar">Bar</h1>
          </div>
        </div>
      </div>`);
  });

  it('html.pipe adjusts the MDAST as per markup markdown config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [200, TEST_MARKUP_CONFIG_MD]);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<h1 id="hello">Hello</h1>
      <div class="corge">
        <p class="bar" baz="qux">from github.</p>
      </div>`);
  });

  it('html.pipe adjusts the MDAST as per markup content config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [200, TEST_MARKUP_CONFIG_CONTENT]);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n\n---\n\n# Bar']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<div class="corge">
        <div class="bar" baz="qux">
          <h1 id="hello">Hello</h1>
          <p>from github.</p>
        </div>
      </div>
      <div>
        <h1 id="bar">Bar</h1>
      </div>`);
  });

  it('html.pipe adjusts single section per markup content config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [200, TEST_MARKUP_CONFIG_CONTENT]);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<div class="corge">
        <div class="bar" baz="qux">
          <h1 id="hello">Hello</h1>
          <p>from github.</p>
        </div>
      </div>`);
  });

  it('html.pipe adjusts the DOM as per markup config', async () => {
    nock('https://raw.githubusercontent.com')
      .get('/adobe/test-repo/master/helix-markup.yaml')
      .reply(() => [200, TEST_MARKUP_CONFIG_HTML]);
    nock('https://adobeioruntime.net')
      .get('/api/v1/web/helix/helix-services/content-proxy@v1?owner=adobe&repo=test-repo&path=%2Fhello.md&ref=master')
      .reply(() => [200, '# Hello\nfrom github.\n']);

    action.downloader = new Downloader(context, action, { forceHttp1: true });

    const result = await pipe((ctx) => {
      const { content } = ctx;
      ctx.response = { status: 200, body: content.document.body.innerHTML };
    }, context, action);

    expectBodyEquals(result,
      `<h1 id="hello">Hello</h1>
      <div class="corge">
        <p class="bar" baz="qux">from github.</p>
      </div>`);
  });
});
