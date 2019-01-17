import mysql from 'mysql'

class Connection {
  constructor () {}
  open (config) {
    this.connection = mysql.createConnection(config)
    this.connection.connect()
  }
  close () {
    this.connection.end()
  }
  query () {
    this.connection.query(...arguments)
  }
}

export default Connection
