import _ from "lodash";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + "/kapacitor/v1/tasks";
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = {
      'Content-Type': 'application/json'
    };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options) {
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    if (query.targets.length <= 0) {
      return this.q.when({
        data: []
      });
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }

    return this.doRequest({
      url: this.url,
      method: 'GET'
    }).then(function (queryResult) {

      if (queryResult == undefined || queryResult.data == undefined || queryResult.data.tasks == undefined || query == undefined || query.targets == undefined || query.targets[0] == undefined || query.targets[0].target == undefined) {
        return {
          data: []
        };
      }

      var tasks = queryResult.data.tasks;
      var selectedDatabase = query.targets[0].target;

      var columns = [{
          "text": "S.No",
          "type": "string"
        },
        {
          "text": "created",
          "type": "time"
        },
        // {"text": "dbrps", "type": "string"},
        {
          "text": "id",
          "type": "string"
        },
        {
          "text": "last-enabled",
          "type": "time"
        },
        {
          "text": "modified",
          "type": "time"
        },
        {
          "text": "status",
          "type": "string"
        },
        {
          "text": "type",
          "type": "string"
        }
        // {"text": "script", "type": "string"},
      ];

      var rows = [];

      var snum = 1;
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var toBeUsed = false;

        var dbs = task.dbrps;

        if (dbs != undefined && _.size(dbs) > 0) {

          for (var j = 0; j < _.size(dbs); j++) {
            if (dbs[j].db == selectedDatabase) {
              toBeUsed = true;
            }
          }
        }

        if (toBeUsed) {

          var createdDate = new Date((task.created).substring(0, 19));
          var modifiedDate = new Date((task.modified).substring(0, 19));
          var lastEnabledDate = new Date((task["last-enabled"]).substring(0, 19));

          var row = [];
          row.push(parseInt(String(snum)));
          // row.push(createdDate.getFullYear()+"/"+(createdDate.getMonth()+1)+"/"+createdDate.getDay()+" "+createdDate.getDate());
          row.push(createdDate.toDateString());
          // row.push(dbNames);

          row.push(task.id);
          row.push(lastEnabledDate.toDateString());
          row.push(modifiedDate.toDateString());
          row.push(task.status);
          row.push(task.type);
          // row.push(task.script);
          rows.push(row);

          snum++;
        }

      }

      var tableElement = {};

      tableElement.columns = columns;
      tableElement.rows = rows;
      tableElement.type = "table";

      var tableElements = [];
      tableElements.push(tableElement);

      return {
        data: tableElements
      };

    });
  }

  testDatasource() {
    return this.doRequest({
      url: this.url,
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        return {
          status: "success",
          message: "Kapacitor is reachable",
          title: "Success"
        };
      }
    });
  }

  annotationQuery(options) {
    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    var annotationQuery = {
      range: options.range,
      annotation: {
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
        query: query
      },
      rangeRaw: options.rangeRaw
    };

    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;

    var annotationElement = {
      "annotation": "Kapacitor Grafana Datasource Plugin",
      "time": dateTime,
      "title": "Kapacitor Alerts List"
    };

    annotationResult.push(annotationElement);
    return annotationResult;
  }

  metricFindQuery(query) {
    return this.doRequest({
      url: this.url,
      method: 'GET',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {

    if (result == undefined || result.data == undefined || result.data.tasks == undefined) {
      return {
        data: {}
      };
    }

    var tasks = result.data.tasks;

    let databasesSet = new Set();

    for (var i = 0; i < _.size(tasks); i++) {
      var task = tasks[i];
      var dbs = task.dbrps;

      if (dbs != undefined && _.size(dbs) > 0) {

        for (let j = 0; j < _.size(dbs); j++) {
          databasesSet.add(dbs[j].db);
        }
      }
    }

    var databaseList = Array.from(databasesSet);

    return _.map(databaseList, function (d, i) {
      return {
        text: d,
        value: d
      };
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select database';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie'
      };
    });

    options.targets = targets;

    return options;
  }

  getTagKeys(options) {
    var tagKeys = [{
        "text": "created",
        "type": "time"
      },
      // {"text": "dbrps", "type": "string"},
      {
        "text": "id",
        "type": "string"
      },
      {
        "text": "last-enabled",
        "type": "time"
      },
      {
        "text": "modified",
        "type": "time"
      },
      {
        "text": "status",
        "type": "string"
      },
      {
        "text": "type",
        "type": "string"
      }
      // {"text": "script", "type": "string"},
    ];

    return tagKeys;
  }

  getTagValues(options) {
    var allTasks = this.doRequest({
      url: this.url,
      method: 'GET',
    });

    var tagValues = [];

    if (allTasks == undefined || allTasks.data == undefined || allTasks.data.tasks == undefined || options == undefined || options.key == undefined) {
      return tagValues;
    }

    var keyToBeSearched = options.key;

    var tasks = result.data.tasks;

    for (var i = 0; i < _.size(tasks); i++) {
      var task = tasks[i];
      var value = task[keyToBeSearched];
      tagValues.push(value);
    }

    return tagValues;
  }

}