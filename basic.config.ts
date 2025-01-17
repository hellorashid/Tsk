
// Basic Project Configuration
// see  the docs for more info: https://docs.basic.tech
export const config = {
  name: "tsk.lol",
  project_id: "701b11bc-59a8-45b5-8148-7184d7733e5b"
};

export const schema = {
		"project_id": "701b11bc-59a8-45b5-8148-7184d7733e5b",
		"version": 1,
		"tables": {
			"tasks": {
				"name": "tasks",
				"type": "collection",
				"fields": {
					"name": {
						"type": "string"
					},
					"description": {
						"type": "string"
					},
					"completed": {
						"type": "boolean"
					}
				}
			}
		}
	}
	;
