CREATE TABLE "daily_nutrition" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" integer,
	"value" numeric(10, 2) NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" integer,
	"operator" varchar(2) NOT NULL,
	"target_value" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nutrition_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition" ADD CONSTRAINT "daily_nutrition_metric_id_nutrition_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."nutrition_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_metric_id_nutrition_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."nutrition_metrics"("id") ON DELETE no action ON UPDATE no action;