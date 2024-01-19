#!/bin/bash

# This workaround is borrowed from https://github.com/cocogitto/cocogitto/issues/300
# It extracts the top chunk of an individual plugin's changelog into the github release changelog file.

if [ ! -f "$1" ]; then
  echo "The file passed as first argument, $1, does not exist."
  exit 1
fi

separator_count=0
extract_data=false

while IFS= read -r line; do
  if $extract_data && [[ "$line" != "- - -" ]]; then
    echo "$line"
  fi

  if [[ "$line" == "- - -" ]]; then
    ((separator_count++))
    if ((separator_count == 1)); then
      extract_data=true
    elif ((separator_count == 2)); then
      break
    fi
  fi
done < "$1"
