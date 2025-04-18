
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
				}
			}
		}
	},
	"version": 2,
	"project_id": "701b11bc-59a8-45b5-8148-7184d7733e5b"
}
