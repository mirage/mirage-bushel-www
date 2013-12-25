#!/bin/sh -ex
rsync -av --exclude .git --exclude sync.sh --delete volstagg-0.srg.cl.cam.ac.uk:doc/ .
