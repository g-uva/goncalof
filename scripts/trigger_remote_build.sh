#!/bin/bash
gh repo set-default git@github.com:g-uva/goncalof.git
gh workflow run pages.yml --ref main
# In case you wanna check the list of last ran workflows.
# gh run list --workflow=pages.yml