-- A trip's to-do list: what has to be done before and during the trip. Groups
-- are free text chosen by the owner ("Documents", "Packing"); template_key marks
-- an item that came from the built-in suggestions, so it is not offered twice.
CREATE TABLE todos (
    id           uuid PRIMARY KEY,
    trip_id      uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title        varchar(300) NOT NULL,
    notes        varchar(2000),
    group_name   varchar(80),
    due_date     date,
    done         boolean NOT NULL DEFAULT false,
    order_index  integer NOT NULL DEFAULT 0,
    template_key varchar(80),
    created_at   timestamp NOT NULL DEFAULT now()
);
CREATE INDEX idx_todos_trip ON todos (trip_id);
