'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

exports.default = {
  glueTable: '-',
  glueIndex: '.',
  table: function table() {
    return Array.prototype.join.call(arguments, this.glueTable);
  },
  index: function index() {
    return Array.prototype.join.call(arguments, this.glueIndex);
  },

  /**
   * 优化Schema配置，转成固定type的形式
   */
  optimize: function optimize(fields, ignoreType) {
    var _this = this;

    if (fields instanceof Array) {
      // 对象数组
      fields = fields.map(function (item) {
        return _this.optimize(item);
      });
      return ignoreType ? fields : { type: fields };
    }
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      // 单数据类型
      return ignoreType ? fields : { type: fields };
    }
    if (this.isField(fields)) {
      // 类型对象
      return Object.assign({}, fields, { type: this.optimize(fields.type, true) });
    }
    for (var field in fields) {
      fields[field] = this.optimize(fields[field]);
    }
    return ignoreType ? fields : { type: fields };
  },


  /**
   * 判断Schema声明是否为字段配置
   */
  isField: function isField(fields) {
    var size = 0;
    var keywords = ['type', 'unique', 'required', 'ref', 'id', '_id', 'default', 'set', 'enum', 'formatter'];
    for (var field in fields) {
      if (keywords.indexOf(field) !== -1) size++;
    }
    return size > 0;
  },


  /**
   * 获取Schema对应的DDL
   * @param {Boolean} withDrop 是否生成drop table语句
   * @param {Boolean} withAuto 是否添加autoId、autoIndex字段
   *  autoId - 存储所属文档的主键
   *  autoIndex - 存储记录在文档中的位置，如'0','f1','f1.0','f1.0.fx','f1.0.fx.0'
   */
  ddl: function ddl(tableName, fields, withDrop, withAuto) {
    tableName = this.table(tableName);
    var result = [];
    if (fields instanceof Array) {
      if (fields.length < 1) throw 'schema has empty array field';
      if (fields.length > 1) throw 'schema has array field, but length greater than 1';
      fields = fields[0];
    }
    if (withDrop) {
      result.push("drop table if exists `" + tableName + "`;");
    }
    var sql = [];
    sql.push("create table `" + tableName + "` (");
    if (withAuto) {
      sql.push("`autoId` int(11) NOT NULL DEFAULT '0',");
      sql.push("`autoIndex` varchar(255) NOT NULL DEFAULT '',");
    } else {
      sql.push("`_id` int(11) NOT NULL AUTO_INCREMENT,");
    }
    for (var field in fields) {
      var value = fields[field];
      var dataType = Object.prototype.toString.call(value.type);
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          result.push.apply(result, _toConsumableArray(this.ddl(this.table(tableName, field), value.type, withDrop, true)));
          break;
        default:
          if (value.type === String) {
            sql.push("`" + field + "` varchar(255) NOT NULL DEFAULT '',");
          } else if (value.type === Number) {
            sql.push("`" + field + "` double NOT NULL DEFAULT 0,");
          } else if (value.type === Date) {
            sql.push("`" + field + "` datetime NOT NULL DEFAULT '',");
          } else {
            throw 'schema has not supported field [' + field + '] with type [' + dataType + ']';
          }
      }
    }
    if (withAuto) {
      sql.push("PRIMARY KEY (`autoId`, `autoIndex`)");
    } else {
      sql.push("PRIMARY KEY (`_id`)");
    }
    sql.push(');');
    result.push(sql.join(''));
    return result;
  }
};