const restify = require('restify')
const Promise = require('bluebird')
const Earners = require('../models/earners')
const EarnerData = require('../models/earner-data')

const NotFoundError = restify.NotFoundError
const keys = Object.keys


module.exports = function earnerRoutes(server) {
  server.post('/users', createEarner)
  function createEarner(req, res, next) {
    const id = req.body.id
    const metadata = req.body.metadata
    const metadataRows = keys(metadata).map(function (key) {
      return {
        earnerId: id,
        key: key,
        value: metadata[key]
      }
    })

    const putRow = function (row) { return EarnerData.put(row) }

    Earners.put({id: id})
      .then(function(result) {
        return Promise.all(metadataRows.map(putRow))
      })

      .then(function(results) {
        return Earners.getOne({id: id}, {relationships: true})
      })

      .then(function(earner) {
        res.header('Location', '/users/' + id)
        return res.send(201, earner.toResponse())
      })

      .catch(res.logInternalError('POST /users – Error creating new earner'))
  }

  server.get('/users/:userId', findEarner)
  function findEarner(req, res, next) {
    const id = req.params.userId
    Earners.getOne({id: id}, {relationships: true})
      .then(function(earner) {
        if (!earner)
          throw new NotFoundError('Could not find earner with id `' + req.params.userId + '`')
        return res.send(200, earner.toResponse())
      })

      .catch(NotFoundError, next)
      .catch(res.logInternalError('DELETE /users/:userId – Error deleting user'))
  }

  server.put('/users/:userId', updateEarner)
  function updateEarner(req, res, next) {
    const id = req.params.userId
    const metadata = req.body

    Earners.getOne({id: id}, {relationships: true})
      .then(function(earner) {
        if (!earner)
          throw new NotFoundError('Could not find earner with id `' + req.params.userId + '`')

        return Promise.all(keys(metadata).map(function (key) {
          const value = metadata[key]
          if (value === null) {
            return EarnerData.del({
              earnerId: id,
              key: key
            })
          }

          return EarnerData.put({
            earnerId: id,
            key: key,
            value: value,
          }, {uniqueKey: ['earnerId', 'key']})
        }))
      })

      .then(function(results) {
        return res.send(200, {status: 'updated'})
      })

      .catch(NotFoundError, next)
      .catch(res.logInternalError('DELETE /users/:userId – Error deleting user'))
  }

  server.del('/users/:userId', deleteEarner)
  function deleteEarner(req, res, next) {
    const id = req.params.userId
    const query = {id: id}
    Earners.getOne(query)
      .then(function(earner) {
        if (!earner)
          throw new NotFoundError('Could not find earner with id `' + req.params.userId + '`')

        return Earners.del(query, {limit: 1})
      })

      .then(function(result) {
        return res.send(200, {status: 'deleted'})
      })

      .catch(NotFoundError, next)
      .catch(res.logInternalError('DELETE /users/:userId – Error deleting user'))
  }
}