#!/bin/sh -ex
rsync -av --exclude .git --exclude sync.sh --delete ~/.opam/doc/doc/ .
