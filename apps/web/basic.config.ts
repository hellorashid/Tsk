
// Basic Project Configuration
// see  the docs for more info: https://docs.basic.tech
export const config = {
	name: "tsk.lol",
	project_id: "701b11bc-59a8-45b5-8148-7184d7733e5b"
};

export const schema = {
	"tables": {
		"tasks": {
			"name": "tasks",
			"type": "collection",
			"fields": {
				"name": {
					"type": "string"
				},
				"labels": {
					"type": "string",
					"indexed": true
				},
				"completed": {
					"type": "boolean"
				},
				"description": {
					"type": "string"
				},
				"parentTaskId": {
					"type": "string",
					"indexed": true
				}
			}
		},
		"filters": {
			"type": "collection",
			"fields": {
				"name": {
					"type": "string",
					"indexed": true
				},
				"labels": {
					"type": "string",
					"indexed": true
				}, 
				"color": {
					"type": "string",
					"indexed": true
				  },
				  "icon": {
					"type": "string",
					"indexed": true
				  }
			}
		},
		"schedule": {
			"type": "collection",
			"fields": {
				"end": {
					"type": "json",
					"indexed": true
				},
				"type": {
					"type": "string",
					"indexed": true
				},
				"color": {
					"type": "string",
					"indexed": true
				},
				"start": {
					"type": "json",
					"indexed": true
				},
				"title": {
					"type": "string",
					"indexed": true
				},
				"taskId": {
					"type": "string",
					"indexed": true
				},
				"description": {
					"type": "string",
					"indexed": true
				},
				"metadata": {
					"type": "json",
					"indexed": true
				}
			}
		}
	},
	"version": 6,
	"project_id": "701b11bc-59a8-45b5-8148-7184d7733e5b"
}