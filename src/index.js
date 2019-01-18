import Schema from './schema'
import Model from './model'
import Connection from './connection';

class Mongoose {

  constructor () {
    this.Schema = Schema
    this.Promise = Promise
    this.$collections = {} // 集合与模型名称的映射
    this.$models = {} // 模型名称与模型类的映射
  }

  connect (config) {
    this.connection = new Connection()
    this.connection.open(config)
  }

  disconnect () {
    this.connection.close()
  }

  model (name, schema) {
    let instance = this
    if (!(schema instanceof Schema)) schema = new Schema(schema, {collection: name})
    let collection = schema.options.collection
    let model = class extends Model {
      static name () {return name}
      static schema () {return schema}
      static collection () {return collection}
      static model () {return instance.$models[name]}
      model () {return instance.$models[name]}
    }
    this.$collections[collection] = name
    this.$models[name] = model
    return model
  }

}

export default new Mongoose()
