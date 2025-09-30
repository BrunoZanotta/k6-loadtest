SHELL := /bin/bash

VUS ?= 500
DURATION ?= 5m
BASE_URL ?= https://test-api.k6.io/public/crocodiles

K6_BIN ?= k6

run:
	$(K6_BIN) run -e VUS=$(VUS) -e DURATION=$(DURATION) -e BASE_URL=$(BASE_URL) src/load_test.js --summary-trend-stats "avg,med,min,max,p(90),p(95),p(99)"

clean:
	rm -f reports/summary.html reports/summary.json