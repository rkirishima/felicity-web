alter table doug_threads
  add column if not exists topic_summary text,
  add column if not exists topic_summary_at_count int default 0;
