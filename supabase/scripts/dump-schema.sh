#!/bin/bash
set -e

# Directory for schema dumps
DUMP_DIR="$(dirname "$0")/../schema_dumps"
mkdir -p "$DUMP_DIR"

# Timestamp for filename
STAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="schema_${STAMP}.sql"

# Dump the schema
npx supabase db dump --schema public --file "$FILENAME"

# Move to organized folder
mv "$FILENAME" "$DUMP_DIR/$FILENAME"

echo "Schema dumped to $DUMP_DIR/$FILENAME" 