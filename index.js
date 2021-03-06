// New Relic Server monitoring support
if ( process.env.NEW_RELIC_ENABLED ) {
  require( "newrelic" );
}

const package = require('./package')
const restify = require('restify');
const bunyan = require('bunyan')
const applyRoutes = require('./routes')
const logInternalError = require('./middleware/log-internal-error')
const resolvePath = require('./middleware/resolve-path')
const verifyRequest = require('./middleware/verify-request')

const logger = bunyan.createLogger({
  name: package.name
});

const server = restify.createServer({
  name: package.name,
  version: package.version,
  log: logger,
});

server.pre(restify.pre.sanitizePath());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser({mapParams: false}));
server.use(restify.bodyParser({mapParams: false, rejectUnknown: true}));
server.use(logInternalError())
server.use(resolvePath())
server.use(verifyRequest({
  whitelists: {
    // no authorization check peformed
    global: [
      '/',
      '/healthcheck',
      /^\/public\/.+/,
    ],

    // issuers can only access these routes (in addtion to above)
    issuer: [
      '/auth-test',
      /^\/users\/.+?\/badges\/?$/
    ],
  },
}))

applyRoutes(server);

module.exports = server;

if (!module.parent) {
  server.listen(process.env.PORT || 8080, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
}
