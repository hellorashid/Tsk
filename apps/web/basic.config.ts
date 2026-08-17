import { defineSchema } from "@basictech/schema/define";

// Basic Project Configuration
// see the docs for more info: https://docs.basic.tech
export const PROJECT_ID = "did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b";

export const config = {
	name: "tsk.lol",
	project_id: PROJECT_ID,
};

export const schema = defineSchema({
	project_id: PROJECT_ID,
	version: 6,
	tables: {
		tasks: {
			name: "tasks",
			type: "collection",
			fields: {
				name: {
					type: "string",
				},
				labels: {
					type: "string",
					indexed: true,
				},
				completed: {
					type: "boolean",
				},
				description: {
					type: "string",
				},
				parentTaskId: {
					type: "string",
					indexed: true,
				},
			},
		},
		filters: {
			type: "collection",
			fields: {
				name: {
					type: "string",
					indexed: true,
				},
				labels: {
					type: "string",
					indexed: true,
				},
				color: {
					type: "string",
					indexed: true,
				},
				icon: {
					type: "string",
					indexed: true,
				},
			},
		},
		schedule: {
			type: "collection",
			fields: {
				end: {
					type: "json",
					indexed: true,
				},
				type: {
					type: "string",
					indexed: true,
				},
				color: {
					type: "string",
					indexed: true,
				},
				start: {
					type: "json",
					indexed: true,
				},
				title: {
					type: "string",
					indexed: true,
				},
				taskId: {
					type: "string",
					indexed: true,
				},
				description: {
					type: "string",
					indexed: true,
				},
				metadata: {
					type: "json",
					indexed: true,
				},
			},
		},
	},
});
