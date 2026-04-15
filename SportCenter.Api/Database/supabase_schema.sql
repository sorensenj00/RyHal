-- ========================================
-- SportCenter Supabase Database Schema
-- Matches EF Core Npgsql default naming (PascalCase with quotes)
-- Run this in Supabase SQL Editor before first deployment
-- ========================================

-- ========================================
-- 1. LOCATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Locations" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL
);

-- ========================================
-- 2. EVENT SERIES TABLE (with owned RecurrenceRule)
-- ========================================
CREATE TABLE IF NOT EXISTS "EventSeries" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Category" INTEGER NOT NULL,
    "Frequency" INTEGER NOT NULL,
    "EndDate" TIMESTAMP NOT NULL,
    "LocationId" INTEGER NOT NULL,
    "TemplateId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy" TEXT NOT NULL
);

-- ========================================
-- 3. EVENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Events" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "StartTime" TIMESTAMP,
    "EndTime" TIMESTAMP,
    "Category" INTEGER NOT NULL,
    "SeriesId" INTEGER,
    "IsModifiedFromSeries" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsCancelled" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsDraft" BOOLEAN NOT NULL DEFAULT FALSE,
    "TemplateId" INTEGER
);

-- ========================================
-- 4. EVENT LOCATIONS JOIN TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "EventLocations" (
    "Id" SERIAL PRIMARY KEY,
    "EventId" INTEGER NOT NULL,
    "LocationId" INTEGER,
    "StartTime" TIMESTAMP,
    "EndTime" TIMESTAMP
);

-- ========================================
-- FOREIGN KEY CONSTRAINTS
-- ========================================

-- EventSeries -> Locations
ALTER TABLE "EventSeries"
ADD CONSTRAINT "FK_EventSeries_Locations_LocationId"
FOREIGN KEY ("LocationId") REFERENCES "Locations"("Id")
ON DELETE CASCADE;

-- Events -> EventSeries
ALTER TABLE "Events"
ADD CONSTRAINT "FK_Events_EventSeries_SeriesId"
FOREIGN KEY ("SeriesId") REFERENCES "EventSeries"("Id");

-- EventLocations -> Events
ALTER TABLE "EventLocations"
ADD CONSTRAINT "FK_EventLocations_Events_EventId"
FOREIGN KEY ("EventId") REFERENCES "Events"("Id")
ON DELETE CASCADE;

-- EventLocations -> Locations
ALTER TABLE "EventLocations"
ADD CONSTRAINT "FK_EventLocations_Locations_LocationId"
FOREIGN KEY ("LocationId") REFERENCES "Locations"("Id")
ON DELETE RESTRICT;

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS "IX_EventLocations_EventId" ON "EventLocations"("EventId");
CREATE INDEX IF NOT EXISTS "IX_EventLocations_LocationId" ON "EventLocations"("LocationId");
CREATE INDEX IF NOT EXISTS "IX_Events_SeriesId" ON "Events"("SeriesId");
CREATE INDEX IF NOT EXISTS "IX_EventSeries_LocationId" ON "EventSeries"("LocationId");

-- ========================================
-- OPTIONAL: Enable Row Level Security (RLS)
-- Only enable if using Supabase Auth with policies
-- ========================================
-- ALTER TABLE "Events" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EventSeries" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EventLocations" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Locations" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- SAMPLE DATA (optional)
-- ========================================
-- INSERT INTO "Locations" ("Name") VALUES ('Hal A'), ('Hal B'), ('Fitness'), ('Sprog');
