# Import of elad's HRG folder into the match folders

1. On the Mac (via the device VM), build a manifest of the folder:
   `cd ~/mnt/HRG && find . -type f -printf '%s\t%p\n' > ~/hrg_manifest.tsv`
2. Map every file to a match + folder category:
   `python3 classify.py ~/hrg_manifest.tsv > plan.tsv`
   Columns: match_key, category, kind (ours/opponent for full matches), action
   (upload / link / dup / skip), mb, title, path, note.
3. Once the Supabase project is live: create the matches listed in `MATCHES`,
   then upload every `upload` row to the `files` bucket (resumable/TUS for big
   videos) and insert a `match_files` row. `dup` rows point at the library copy.
   `link` rows (opponent full matches, ~6 GB each) get an external link.
