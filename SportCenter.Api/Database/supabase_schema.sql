-- ========================================
-- SportCenter Supabase Database Schema
-- Created for LindholtDev branch
-- ========================================

-- Enable UUID extension if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. LOCATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS locations (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL
);

-- ========================================
-- 2. EVENT SERIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS event_series (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Category" INTEGER NOT NULL, -- Enum stored as integer
    "Frequency" INTEGER NOT NULL, -- RecurrenceFrequency enum
    "EndDate" TIMESTAMP NOT NULL,
    "LocationId" INTEGER NOT NULL,
    "TemplateId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CreatedBy" TEXT NOT NULL
);

-- ========================================
-- 3. EVENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS events (
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
CREATE TABLE IF NOT EXISTS event_locations (
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
ALTER TABLE event_series
ADD CONSTRAINT "FK_EventSeries_Locations_LocationId"
FOREIGN KEY ("LocationId") REFERENCES locations("Id")
ON DELETE CASCADE;

-- Events -> EventSeries
ALTER TABLE events
ADD CONSTRAINT "FK_Events_EventSeries_SeriesId"
FOREIGN KEY ("SeriesId") REFERENCES event_series("Id");

-- EventLocations -> Events
ALTER TABLE event_locations
ADD CONSTRAINT "FK_EventLocations_Events_EventId"
FOREIGN KEY ("EventId") REFERENCES events("Id")
ON DELETE CASCADE;

-- EventLocations -> Locations
ALTER TABLE event_locations
ADD CONSTRAINT "FK_EventLocations_Locations_LocationId"
FOREIGN KEY ("LocationId") REFERENCES locations("Id")
ON DELETE RESTRICT;

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS "IX_EventLocations_EventId" ON event_locations("EventId");
CREATE INDEX IF NOT EXISTS "IX_EventLocations_LocationId" ON event_locations("LocationId");
CREATE INDEX IF NOT EXISTS "IX_Events_SeriesId" ON events("SeriesId");
CREATE INDEX IF NOT EXISTS "IX_EventSeries_LocationId" ON event_series("LocationId");

-- ========================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- Enable if using Supabase Auth
-- ========================================
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- SAMPLE DATA (optional for testing)
-- ========================================
-- INSERT INTO locations ("Name") VALUES ('Hal A'), ('Hal B'), ('Fitness'), ('Sprog');
