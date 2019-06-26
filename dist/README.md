## kapacitor-grafana-datasource-plugin - a kapacitor backend datasource plugin for grafana

More documentation about datasource plugins can be found in the [Docs](https://github.com/grafana/grafana/blob/master/docs/sources/plugins/developing/datasources.md).

This repository has been forked and build over the [Simple JSON Datasource](https://github.com/grafana/simple-json-datasource) plugin for Grafana. Thanks to the Simple JSON Datasource contributors.


### Kapacitor Datasource Setup

1. Go to Configurations and select 'Data Sources'.
2. Go to 'Add data source' and select 'KapacitorSimpleJson'.
3. In the KapacitorSimpleJson Datasource configuration, enter the URL of the kapacitor server. Please do not add '/kapacitor/v1/tasks' or any other apiendpoint in it, just enter the URL including the port number of the kapacitor server if required.
4. Save and Test the settings.

### Kapacitor Datasource Usage

1. While creating a new dashboard use the KapacitorSimpleJson datasource.
2. Once you select the KapacitorSimpleJson datasource in the Queries panel,a drop down menu to select the particular database will appear.
3. Select the database whose alerts list you want to view.
4. Under the Visualisation panel select Table.
5. The list of all alerts on the selected database allong with its details will appear in the table.


### Dev setup

This plugin requires node 6.10.0

```
npm install -g yarn
yarn install
npm run build
```
