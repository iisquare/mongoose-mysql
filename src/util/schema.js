
export default {
  glueTable: '-',
  glueIndex: '.',
  table() {
    return Array.prototype.join.call(arguments, this.glueTable)
  },
  index() {
    return Array.prototype.join.call(arguments, this.glueIndex)
  },
  optimizeType (fields) {
    let dataType = Object.prototype.toString.call(fields)
    switch (dataType) {
      case '[object Array]':
        return {type: this.optimizeArray(fields)}
      case '[object Object]':
        if (this.isTypeObject(fields)) {
          fields.type = this.optimizeType(fields.type).type
          return fields
        }
        return {type: this.optimizeObject(fields)}
      default:
        return {type: fields}
    }
  },
  optimizeObject (fields) {
    for (let field in fields) {
      fields[field] = this.optimizeType(fields[field])
    }
    return fields
  },
  optimizeArray (fields) {
    return fields.map(item => this.optimizeType(item))
  },
  /**
   * 判断Schema声明是否为字段配置
   */
  isTypeObject (fields) {
    const keywords = [
      'type', 'unique', 'required', 'ref', 'id', '_id', 'default', 'set', 'enum', 'formatter'
    ]
    for (let field in fields) {
      if (keywords.indexOf(field) === -1) return false
    }
    return true
  },

  /**
   * 获取Schema对应的DDL
   * @param {Boolean} withDrop 是否生成drop table语句
   * @param {Boolean} withAuto 是否添加autoId、autoIndex字段
   *  autoId - 存储所属文档的主键
   *  autoIndex - 存储记录在文档中的位置，如'0','f1','f1.0','f1.0.fx','f1.0.fx.0'
   */
  ddl (tableName, fields, withDrop, withAuto) {
    tableName = this.table(tableName)
    let result = []
    if (fields instanceof Array) {
      if (fields.length < 1) throw 'schema has empty array field'
      if (fields.length > 1) throw 'schema has array field, but length greater than 1'
      fields = fields[0]
    }
    if (withDrop) {
      result.push("drop table if exists `" + tableName + "`;")
    }
    let sql = []
    sql.push("create table `" + tableName + "` (")
    if (withAuto) {
      sql.push("`autoId` int(11) NOT NULL DEFAULT '0',")
      sql.push("`autoIndex` varchar(255) NOT NULL DEFAULT '',")
    } else {
      sql.push("`_id` int(11) NOT NULL AUTO_INCREMENT,")
    }
    for (let field in fields) {
      let value = fields[field]
      let dataType = Object.prototype.toString.call(value.type)
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          result.push(...this.ddl(this.table(tableName, field), value.type, withDrop, true))
          break;
        default:
          if (value.type === String) {
            sql.push("`" + field + "` varchar(255) NOT NULL DEFAULT '',")
          } else if (value.type === Number) {
            sql.push("`" + field + "` double NOT NULL DEFAULT 0,")
          } else if (value.type === Date) {
            sql.push("`" + field + "` datetime NOT NULL DEFAULT '',")
          } else {
            throw 'schema has not supported field [' + field + '] with type [' + dataType + ']'
          }
      }
    }
    if (withAuto) {
      sql.push("PRIMARY KEY (`autoId`, `autoIndex`)")
    } else {
      sql.push("PRIMARY KEY (`_id`)")
    }
    sql.push(');')
    result.push(sql.join(''))
    return result
  }
}