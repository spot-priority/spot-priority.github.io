/**
 * Scenarios.js
 * Comprehensive library of incident scenarios for the SPOT Framework.
 * Includes basic incidents, cascading infrastructure failures (6 alerts),
 * and high-volume multi-service collapsed states (8 alerts).
 */

export const SCENARIOS = [
    {
        id: 'scenario-1-auth-outage',
        name: 'Scenario 1: Authentication Gateway Degraded (Standard Sev-1)',
        badge: 'Basic Triage • 4 Alerts',
        difficulty: 'Beginner',
        category: 'Service Outage',
        subtitle: 'Peak morning traffic is starting, and auth servers are rejecting sessions.',
        incidentContext: 'It is 09:05 AM on Monday. An alert storm triggers as the main OAuth service errors out. Meanwhile, background data pipelines and secondary services trigger lower-priority warnings.',
        tasks: [
            {
                id: 's1-t1',
                title: 'Auth Gateway 502 Bad Gateway Spike',
                description: '70% of login requests failing across all web and mobile clients.',
                severity: 'sev-1',
                system: 'OAuth / Gateway',
                metric: 'Error Rate: 72.4% (Threshold: >1%)'
            },
            {
                id: 's1-t2',
                title: 'Data Warehouse Ingestion Pipeline Lag',
                description: 'Hourly ETL batch is running 18 minutes behind schedule.',
                severity: 'sev-3',
                system: 'Data Eng / BigQuery',
                metric: 'Lag: +18m (SLA: <60m)'
            },
            {
                id: 's1-t3',
                title: 'Internal Admin Portal 500 on Reports Tab',
                description: 'Finance team cannot export monthly PDF statements.',
                severity: 'sev-3',
                system: 'Admin Web',
                metric: 'Affected Users: 4 internal staff'
            },
            {
                id: 's1-t4',
                title: 'Worker Node-08 Disk Usage at 84%',
                description: 'Log partition filling up steadily on one stateless worker.',
                severity: 'sev-4',
                system: 'Kubernetes Nodes',
                metric: 'Disk: 84% (Alert threshold: 85%)'
            }
        ],
        walkthrough: [
            {
                step: 'survey',
                title: 'Survey (S) - Rapid Context Scan',
                narration: 'We scan all 4 alerts. Alert #1 (Auth Gateway 502) blocks 70% of live customers from accessing the application, making it a critical Primary issue. Alerts #2 (ETL lag), #3 (Admin portal), and #4 (Node-08 disk) are contained or non-customer blocking, so they are filtered to Secondary.',
                actions: [
                    { taskId: 's1-t1', surveyGroup: 'primary' },
                    { taskId: 's1-t2', surveyGroup: 'secondary' },
                    { taskId: 's1-t3', surveyGroup: 'secondary' },
                    { taskId: 's1-t4', surveyGroup: 'secondary' }
                ]
            },
            {
                step: 'prioritize',
                title: 'Prioritize (P) - Filter Urgency',
                narration: 'From our primary list, Auth Gateway failure is creating immediate revenue loss and user churn. We classify it as Top Urgency to immediately arrest the bleeding.',
                actions: [
                    { taskId: 's1-t1', urgencyGroup: 'high_urgency' }
                ]
            },
            {
                step: 'optimize',
                title: 'Optimize (O) - Highest Return on Effort',
                narration: 'Rather than performing a full database audit or complex live debugging, we check recent deployments. Release v2.14 was shipped 10 minutes ago. Rolling back the canary takes 90 seconds and has high confidence of full recovery.',
                actions: [
                    { taskId: 's1-t1', impactGroup: 'high_impact', actionMitigation: 'Execute immediate rollback of Release v2.14 to v2.13 on Auth Gateway' }
                ]
            },
            {
                step: 'action',
                title: 'Take Action (T) - Lock & Execute',
                narration: 'Rollback command executed on Auth Gateway. Session success rate restored to 99.8%. Secondary tasks (ETL lag and Node-08 disk) remain safely queued in backlog for the next triage cycle.',
                actions: [
                    { taskId: 's1-t1', actionStatus: 'action_now' },
                    { taskId: 's1-t2', actionStatus: 'deferred' },
                    { taskId: 's1-t3', actionStatus: 'deferred' },
                    { taskId: 's1-t4', actionStatus: 'deferred' }
                ]
            }
        ],
        quiz: {
            surveyQuestion: {
                prompt: 'Step 1 (Survey): Which alerts should be classified into the PRIMARY group?',
                correctPrimaryIds: ['s1-t1'],
                correctSecondaryIds: ['s1-t2', 's1-t3', 's1-t4'],
                feedbackCorrect: '✅ Perfect! Auth Gateway 502 is the only alert directly halting external customer logins. ETL lag and disk warnings are non-critical secondaries.',
                feedbackWrong: '⚠️ Remember SPOT medical triage principles: Only alerts causing direct, catastrophic customer or revenue disruption are Primary. Disk warnings and internal admin pages must not divert initial focus.'
            },
            prioritizeQuestion: {
                prompt: 'Step 2 (Prioritize): Which primary alert demands immediate High Urgency focus?',
                correctHighUrgencyIds: ['s1-t1'],
                feedbackCorrect: '✅ Exactly. Auth 502 has active customer impact and must be stabilized before anything else.',
                feedbackWrong: '⚠️ Auth Gateway failure has highest urgency because every second delayed multiplies failed logins.'
            },
            optimizeQuestion: {
                prompt: 'Step 3 (Optimize): What is the most optimal mitigation action for the Auth failure?',
                options: [
                    { id: 'opt-1', text: 'Rollback recent release v2.14 (deployed 10m ago) in 90 seconds', correct: true, explanation: 'Fastest time-to-mitigation with minimal blast radius.' },
                    { id: 'opt-2', text: 'SSH into each auth pod and run deep memory profiling', correct: false, explanation: 'Too slow during an active outage; troubleshooting happens post-mitigation.' },
                    { id: 'opt-3', text: 'Restart all primary database replicas', correct: false, explanation: 'High risk of cascading outages without evidence of DB failure.' }
                ],
                feedbackCorrect: '✅ Spot on! Optimize is about rapid return on effort—rolling back a suspect release restores uptime immediately.',
                feedbackWrong: '⚠️ In crisis triage, prioritize rapid stabilization over deep root-cause debugging.'
            },
            actionQuestion: {
                prompt: 'Step 4 (Take Action): What should happen to the secondary tasks (ETL lag, disk warning)?',
                options: [
                    { id: 'act-1', text: 'Queue them in the triage backlog to review once Auth is stable', correct: true, explanation: 'SPOT avoids multitasking during critical Sev-1 execution.' },
                    { id: 'act-2', text: 'Work on them simultaneously while waiting for Auth rollback', correct: false, explanation: 'Context switching during an active Sev-1 increases error rates.' },
                    { id: 'act-3', text: 'Delete and ignore them permanently', correct: false, explanation: 'They are secondary, not invalid; they still require eventual resolution.' }
                ],
                feedbackCorrect: '✅ Excellent! Lock in the primary action, keep secondary items in the queue, and repeat SPOT once the main issue is resolved.',
                feedbackWrong: '⚠️ Never multitask across primary and secondary issues during an active incident.'
            },
            keyTakeaway: 'SPOT filtered 4 competing alerts into 1 decisive rollback action in under 2 minutes, preventing distraction by secondary pipeline and disk alerts.'
        }
    },

    {
        id: 'scenario-2-cascading-db-deadlock',
        name: 'Scenario 2: Database Pool Exhaustion & Cascading Lockup',
        badge: 'Cascading Failure • 6 Alerts',
        difficulty: 'Intermediate',
        category: 'Cascading Outage',
        subtitle: 'A single hung database query is choking connection pools and cascading through payments and emails.',
        incidentContext: '14:22 PM: A rogue unindexed query locks the orders table, exhausting connection pools. Within minutes, payment timeouts, email queue spikes, cache evictions, and customer portal lag alarms fire simultaneously.',
        tasks: [
            {
                id: 's2-t1',
                title: 'Primary DB Active Connection Pool at 100%',
                description: 'Postgres master pool saturated with 500/500 connections in idle-in-transaction.',
                severity: 'sev-1',
                system: 'Database Cluster',
                metric: 'Conn Pool: 100% (500/500 connections locked)'
            },
            {
                id: 's2-t2',
                title: 'Payment Gateway 504 Gateway Timeout Spike',
                description: 'Payment microservice unable to record transaction state; 45% of checkouts failing.',
                severity: 'sev-1',
                system: 'Payments API',
                metric: 'Checkout Failure: 45.2% ($14k/min revenue at risk)'
            },
            {
                id: 's2-t3',
                title: 'Order Confirmation Email Queue Backlog (>45,000)',
                description: 'RabbitMQ queue accumulating unacknowledged notification messages.',
                severity: 'sev-2',
                system: 'Async Queue / RabbitMQ',
                metric: 'Queue Depth: 45,800 messages (Growing 800/s)'
            },
            {
                id: 's2-t4',
                title: 'Redis Worker-04 Key Eviction Rate Anomaly',
                description: 'Cache eviction rate increased 25% due to memory pressure.',
                severity: 'sev-3',
                system: 'Redis Cache',
                metric: 'Memory: 78% utilized'
            },
            {
                id: 's2-t5',
                title: 'Customer Help Desk Live Chat Latency',
                description: 'Support agents experiencing 4-second delay on loading customer history.',
                severity: 'sev-3',
                system: 'Internal CRM',
                metric: 'Response Time: 4.2s (Norm: 300ms)'
            },
            {
                id: 's2-t6',
                title: 'Analytics Segment Event Dropped Log Warning',
                description: 'Non-blocking client-side telemetry events dropped at ingestion buffer.',
                severity: 'sev-4',
                system: 'Telemetry',
                metric: 'Drop Rate: 3.1%'
            }
        ],
        walkthrough: [
            {
                step: 'survey',
                title: 'Survey (S) - Filter Root Symptoms vs Downstream Noise',
                narration: '6 alerts hit at once. We identify that Primary DB Pool saturation (#1) and Payment 504 Timeouts (#2) represent active revenue and transaction failure. The Email Queue (#3), Redis Eviction (#4), CRM chat lag (#5), and Analytics drops (#6) are downstream symptoms or secondary noise.',
                actions: [
                    { taskId: 's2-t1', surveyGroup: 'primary' },
                    { taskId: 's2-t2', surveyGroup: 'primary' },
                    { taskId: 's2-t3', surveyGroup: 'secondary' },
                    { taskId: 's2-t4', surveyGroup: 'secondary' },
                    { taskId: 's2-t5', surveyGroup: 'secondary' },
                    { taskId: 's2-t6', surveyGroup: 'secondary' }
                ]
            },
            {
                step: 'prioritize',
                title: 'Prioritize (P) - Pinpoint the Bottleneck',
                narration: 'Between Payments and Database, the Payment timeouts are directly caused by the Database pool starvation. Stabilizing the DB connection pool is the urgent primary bottleneck unlocking everything else.',
                actions: [
                    { taskId: 's2-t1', urgencyGroup: 'high_urgency' },
                    { taskId: 's2-t2', urgencyGroup: 'lower_urgency' }
                ]
            },
            {
                step: 'optimize',
                title: 'Optimize (O) - High-Leverage Mitigation',
                narration: 'Instead of rebooting Postgres (which would abort all ongoing transactions), we terminate blocking queries with `pg_cancel_backend` on idle transactions older than 60s and enable query timeout clamps on PgBouncer.',
                actions: [
                    { taskId: 's2-t1', impactGroup: 'high_impact', actionMitigation: 'Terminate blocking unindexed analytics queries on Postgres master & set statement timeout' }
                ]
            },
            {
                step: 'action',
                title: 'Take Action (T) - Decisive Execution & Unblock',
                narration: 'Blocking queries terminated. Connection pool immediately drops from 500 to 42. Payment API recovers automatically without restart. Secondary email queue drains naturally.',
                actions: [
                    { taskId: 's2-t1', actionStatus: 'action_now' },
                    { taskId: 's2-t2', actionStatus: 'action_now', actionMitigation: 'Verify payment success rate returns to >99%' },
                    { taskId: 's2-t3', actionStatus: 'deferred' },
                    { taskId: 's2-t4', actionStatus: 'deferred' },
                    { taskId: 's2-t5', actionStatus: 'deferred' },
                    { taskId: 's2-t6', actionStatus: 'deferred' }
                ]
            }
        ],
        quiz: {
            surveyQuestion: {
                prompt: 'Step 1 (Survey): Out of the 6 simultaneous alerts, which 2 are PRIMARY critical items?',
                correctPrimaryIds: ['s2-t1', 's2-t2'],
                correctSecondaryIds: ['s2-t3', 's2-t4', 's2-t5', 's2-t6'],
                feedbackCorrect: '✅ Excellent! Database saturation and Payment failure are the core customer-impacting issues. Email queues, Redis, and CRM lag are downstream secondary symptoms.',
                feedbackWrong: '⚠️ Beware of downstream symptom distraction! Email queues and chat portal lag look scary, but they are caused by the database and payment bottlenecks.'
            },
            prioritizeQuestion: {
                prompt: 'Step 2 (Prioritize): Between DB connection exhaustion and Payment 504 timeouts, which is the foundational root bottleneck?',
                correctHighUrgencyIds: ['s2-t1'],
                feedbackCorrect: '✅ Correct! The database connection pool exhaustion is causing the payment timeouts. Fixing the DB unblocks Payments immediately.',
                feedbackWrong: '⚠️ While Payments is where revenue is lost, Payments cannot recover until the underlying Database connection pool is unlocked.'
            },
            optimizeQuestion: {
                prompt: 'Step 3 (Optimize): What is the most effective immediate action on the saturated database?',
                options: [
                    { id: 's2-opt1', text: 'Terminate blocking idle-in-transaction queries via pg_terminate_backend / statement timeout', correct: true, explanation: 'Instantly frees connection slots without crashing ongoing healthy queries.' },
                    { id: 's2-opt2', text: 'Hard restart the primary database cluster', correct: false, explanation: 'Causes full system downtime and potential data corruption during active checkout.' },
                    { id: 's2-opt3', text: 'Increase max_connections from 500 to 2000 in config and restart', correct: false, explanation: 'Will cause severe memory swapping and CPU thrashing.' }
                ],
                feedbackCorrect: '✅ Perfect! Targeted query cancellation frees the pool in seconds with zero service restart downtime.',
                feedbackWrong: '⚠️ Avoid destructive actions like hard database reboots when targeted query termination can clear locks instantly.'
            },
            actionQuestion: {
                prompt: 'Step 4 (Take Action): What should be the on-call engineer’s immediate next action after killing the queries?',
                options: [
                    { id: 's2-act1', text: 'Verify DB connections normalized and payment success rate recovered, then monitor queue drain', correct: true, explanation: 'Confirms end-to-end recovery before closing incident bridge.' },
                    { id: 's2-act2', text: 'Manually purge the 45,000 order confirmation emails to reduce queue size', correct: false, explanation: 'Purging drops real customer receipts! Async queues drain automatically.' }
                ],
                feedbackCorrect: '✅ Exactly right. Once the root bottleneck is freed, verify end-to-end metrics while secondary queues heal automatically.',
                feedbackWrong: '⚠️ Never purge message queues that hold customer order confirmations unless verified invalid.'
            },
            keyTakeaway: 'During cascading failures, SPOT cuts through downstream symptom alerts (email queues, cache warnings, support lag) to focus on the root bottleneck (database locks).'
        }
    },

    {
        id: 'scenario-3-black-friday-collapse',
        name: 'Scenario 3: Peak Traffic Surge & Microservice Cascade',
        badge: 'High-Volume Cascade • 8 Alerts',
        difficulty: 'Advanced',
        category: 'Mega Incident',
        subtitle: '8 alerts hit during the biggest shopping hour of the year. Microservices are cascading.',
        incidentContext: 'Black Friday 20:00 PM: Traffic hits 8x normal volume. An Ingress gateway thread exhaustion triggers a massive alert flood across 8 different monitoring channels.',
        tasks: [
            {
                id: 's3-t1',
                title: 'Kubernetes Ingress 503 Service Unavailable Spike',
                description: 'Main load balancer rejecting 35% of incoming traffic at edge.',
                severity: 'sev-1',
                system: 'Edge / Ingress NGINX',
                metric: 'Ingress 503s: 34.8% (SLA: <0.05%)'
            },
            {
                id: 's3-t2',
                title: 'Checkout & Inventory Service Thread Pool Starvation',
                description: 'Inventory lock API response times climbed from 40ms to 9,800ms.',
                severity: 'sev-1',
                system: 'Inventory Microservice',
                metric: 'Latency p99: 9.8s (Timeout: 10s)'
            },
            {
                id: 's3-t3',
                title: 'Recommendation Engine Microservice Slowdown',
                description: 'Personalized product recommendation widget timing out on product pages.',
                severity: 'sev-2',
                system: 'AI / Recs Service',
                metric: 'Timeout: 2,500ms (Fallback static widget available)'
            },
            {
                id: 's3-t4',
                title: 'Elasticsearch Search Cluster Status RED',
                description: '2 data shards unassigned due to heavy indexing load.',
                severity: 'sev-2',
                system: 'Search Cluster',
                metric: 'Cluster Health: RED (Search queries degraded)'
            },
            {
                id: 's3-t5',
                title: 'Third-Party Fraud Detection API Latency Spike',
                description: 'External fraud verification vendor taking 3.5s per request.',
                severity: 'sev-2',
                system: 'External Vendor API',
                metric: 'Latency: 3,500ms'
            },
            {
                id: 's3-t6',
                title: 'Logstash / FluentBit Ingestion Buffer Overflow',
                description: 'Telemetry log buffer dropping non-critical application debug logs.',
                severity: 'sev-3',
                system: 'Logging Pipeline',
                metric: 'Buffer: 96% full'
            },
            {
                id: 's3-t7',
                title: 'Customer Support Escalation Ticket Volume +400%',
                description: 'Support inbox receiving surge of tickets regarding slow checkout.',
                severity: 'sev-3',
                system: 'Support Zendesk',
                metric: 'New Tickets: 420/hr'
            },
            {
                id: 's3-t8',
                title: 'Prometheus Alertmanager Scraping Timeout on Staging Cluster',
                description: 'Staging environment monitoring pod failed scrape.',
                severity: 'sev-4',
                system: 'Staging Monitoring',
                metric: 'Staging env only'
            }
        ],
        walkthrough: [
            {
                step: 'survey',
                title: 'Survey (S) - Rapid Elimination of Multi-Alert Storm',
                narration: 'With 8 simultaneous alerts, cognitive overload is the #1 danger. We survey and immediately categorize Ingress 503s (#1) and Inventory thread starvation (#2) as Primary (direct checkout blocking). Recommendations (#3), Elasticsearch (#4), Fraud API (#5), Logstash (#6), Support tickets (#7), and Staging noise (#8) are categorized as Secondary.',
                actions: [
                    { taskId: 's3-t1', surveyGroup: 'primary' },
                    { taskId: 's3-t2', surveyGroup: 'primary' },
                    { taskId: 's3-t3', surveyGroup: 'secondary' },
                    { taskId: 's3-t4', surveyGroup: 'secondary' },
                    { taskId: 's3-t5', surveyGroup: 'secondary' },
                    { taskId: 's3-t6', surveyGroup: 'secondary' },
                    { taskId: 's3-t7', surveyGroup: 'secondary' },
                    { taskId: 's3-t8', surveyGroup: 'secondary' }
                ]
            },
            {
                step: 'prioritize',
                title: 'Prioritize (P) - Isolate Highest Urgency Blocker',
                narration: 'Between Ingress 503s and Inventory latency, Ingress 503s are caused by backend pods taking too long to respond. The Inventory service thread pool starvation is holding connections open. Inventory is the critical urgency item.',
                actions: [
                    { taskId: 's3-t2', urgencyGroup: 'high_urgency' },
                    { taskId: 's3-t1', urgencyGroup: 'high_urgency' }
                ]
            },
            {
                step: 'optimize',
                title: 'Optimize (O) - Shed Non-Essential Load (Degrade Gracefully)',
                narration: 'To restore core checkout capacity immediately: (1) Enable circuit-breaker fallback for the Recommendation engine (returning cached static items), (2) Scale Ingress HPA replicas from 20 to 60, and (3) Switch Fraud API to asynchronous post-checkout verification.',
                actions: [
                    { taskId: 's3-t2', impactGroup: 'high_impact', actionMitigation: 'Enable circuit-breaker on Recs & scale Inventory & Ingress pods via HPA autoscale' },
                    { taskId: 's3-t1', impactGroup: 'high_impact', actionMitigation: 'Scale Ingress replicas from 20 to 60' }
                ]
            },
            {
                step: 'action',
                title: 'Take Action (T) - Apply Circuit Breakers & Autoscale',
                narration: 'Mitigations applied. Non-essential recommendation load drops to zero, freeing thread pools on Inventory. Ingress 503s drop from 35% to 0.02%. Checkout flow restored for Black Friday shoppers.',
                actions: [
                    { taskId: 's3-t1', actionStatus: 'action_now' },
                    { taskId: 's3-t2', actionStatus: 'action_now' },
                    { taskId: 's3-t3', actionStatus: 'deferred' },
                    { taskId: 's3-t4', actionStatus: 'deferred' },
                    { taskId: 's3-t5', actionStatus: 'deferred' },
                    { taskId: 's3-t6', actionStatus: 'deferred' },
                    { taskId: 's3-t7', actionStatus: 'deferred' },
                    { taskId: 's3-t8', actionStatus: 'deferred' }
                ]
            }
        ],
        quiz: {
            surveyQuestion: {
                prompt: 'Step 1 (Survey): Out of 8 active alerts, which 2 are PRIMARY critical items that directly halt core customer checkouts?',
                correctPrimaryIds: ['s3-t1', 's3-t2'],
                correctSecondaryIds: ['s3-t3', 's3-t4', 's3-t5', 's3-t6', 's3-t7', 's3-t8'],
                feedbackCorrect: '✅ Outstanding! Ingress 503s and Inventory thread starvation represent active transaction failure. Staging alerts, logging buffers, and non-blocking recommendation slowdowns must be filtered out immediately.',
                feedbackWrong: '⚠️ In high-volume alert floods, aggressively filter out non-revenue blockers (like Recommendation widgets, search indexing, and logging buffers).'
            },
            prioritizeQuestion: {
                prompt: 'Step 2 (Prioritize): What is the core urgency relationship between Ingress 503s and Inventory thread starvation?',
                correctHighUrgencyIds: ['s3-t1', 's3-t2'],
                feedbackCorrect: '✅ Correct! Ingress is overwhelmed because backend Inventory threads are saturated. Both require immediate urgent load relief.',
                feedbackWrong: '⚠️ Ingress 503s and Inventory starvation are tightly coupled in the checkout hot path.'
            },
            optimizeQuestion: {
                prompt: 'Step 3 (Optimize): What is the fastest high-impact mitigation to relieve thread starvation under 8x traffic surge?',
                options: [
                    { id: 's3-opt1', text: 'Activate circuit breaker on recommendation engine to serve cached fallback & scale Ingress pods', correct: true, explanation: 'Sheds non-essential compute load in seconds and frees connection capacity for checkouts.' },
                    { id: 's3-opt2', text: 'Re-index the Elasticsearch cluster to fix the RED status', correct: false, explanation: 'Consumes immense CPU and does not resolve the checkout thread starvation.' },
                    { id: 's3-opt3', text: 'Disable SSL certificates on edge load balancers', correct: false, explanation: 'Severe security breach that will break browser trust entirely.' }
                ],
                feedbackCorrect: '✅ Brilliant! Graceful degradation (circuit breaking non-critical widgets) instantly restores resources for core transactions.',
                feedbackWrong: '⚠️ Remember to Optimize for highest return on effort: shedding non-essential load (recommendation widgets) frees backend capacity instantly.'
            },
            actionQuestion: {
                prompt: 'Step 4 (Take Action): How should the remaining 6 secondary alerts (Elasticsearch, Logstash buffer, etc.) be handled?',
                options: [
                    { id: 's3-act1', text: 'Assign them to the secondary incident channel for post-stabilization resolution once checkout is healthy', correct: true, explanation: 'Prevents incident commander distraction while keeping track of secondary health.' },
                    { id: 's3-act2', text: 'Mute all company Slack channels and ignore them', correct: false, explanation: 'Secondary issues still need tracking once the Sev-1 is stabilized.' }
                ],
                feedbackCorrect: '✅ Perfect! Primary stabilization locked in; secondary items triaged cleanly to backlog.',
                feedbackWrong: '⚠️ Maintain disciplined triage delegation: lock in Sev-1 stabilization first.'
            },
            keyTakeaway: 'In high-pressure Black Friday incidents, SPOT cuts through 8 noisy alerts down to the 2 critical bottlenecks, unlocking graceful degradation in seconds.'
        }
    },

    {
        id: 'scenario-4-security-containment',
        name: 'Scenario 4: Security Credential Exposure & Rapid Containment',
        badge: 'Security Incident • 5 Alerts',
        difficulty: 'Intermediate',
        category: 'Security Triage',
        subtitle: 'An automated secret scanner detected an exposed production AWS key.',
        incidentContext: '03:15 AM: Security bots flag an exposed AWS Access Key ID in a public GitHub repository commit, alongside rate limit warnings and CI pipeline errors.',
        tasks: [
            {
                id: 's4-t1',
                title: 'Production AWS Secret Key Exposed on Public Repo',
                description: 'Full admin IAM credentials leaked in a public commit 6 minutes ago.',
                severity: 'sev-1',
                system: 'Security / IAM',
                metric: 'Credential Age: 6 mins (Active API calls detected)'
            },
            {
                id: 's4-t2',
                title: 'WAF Rate Limiter Warning on Login Endpoint',
                description: 'Unusual IP range sending 50 req/sec to login API.',
                severity: 'sev-2',
                system: 'Cloudflare WAF',
                metric: 'Blocked Requests: 890'
            },
            {
                id: 's4-t3',
                title: 'Nightly Security Vulnerability Scan Failed',
                description: 'Trivy container image scanner timed out on runner-3.',
                severity: 'sev-3',
                system: 'CI/CD Pipeline',
                metric: 'Runner: Timeout 300s'
            },
            {
                id: 's4-t4',
                title: 'DNS Resolution Latency Warning on Staging',
                description: 'Staging DNS lookup taking 120ms (Norm: 20ms).',
                severity: 'sev-4',
                system: 'Staging DNS',
                metric: 'Latency: 120ms'
            },
            {
                id: 's4-t5',
                title: 'Documentation Typo Reported by User',
                description: 'Broken link reported in onboarding guide.',
                severity: 'sev-4',
                system: 'Docs Site',
                metric: '1 ticket'
            }
        ],
        walkthrough: [
            {
                step: 'survey',
                title: 'Survey (S) - Separate Active Threat from Routine Noise',
                narration: 'We survey the security alerts. An exposed Production AWS Secret Key (#1) is an active Sev-1 threat with catastrophic blast radius. WAF rate limiting (#2) is already auto-blocked by Cloudflare. CI/CD scan failure (#3), DNS latency (#4), and doc typos (#5) are clearly secondary.',
                actions: [
                    { taskId: 's4-t1', surveyGroup: 'primary' },
                    { taskId: 's4-t2', surveyGroup: 'secondary' },
                    { taskId: 's4-t3', surveyGroup: 'secondary' },
                    { taskId: 's4-t4', surveyGroup: 'secondary' },
                    { taskId: 's4-t5', surveyGroup: 'secondary' }
                ]
            },
            {
                step: 'prioritize',
                title: 'Prioritize (P) - Absolute Highest Urgency',
                narration: 'Every minute an active AWS credential is exposed allows automated bot scrapers to launch ransomware or exfiltrate databases. Priority is top urgency.',
                actions: [
                    { taskId: 's4-t1', urgencyGroup: 'high_urgency' }
                ]
            },
            {
                step: 'optimize',
                title: 'Optimize (O) - Immediate Revocation & Session Invalidation',
                narration: 'Rather than trying to scrub the git history (which does not invalidate the active secret), we immediately deactivate the IAM key in AWS IAM and revoke active assumed role sessions.',
                actions: [
                    { taskId: 's4-t1', impactGroup: 'high_impact', actionMitigation: 'Deactivate IAM Access Key in AWS Console and revoke active STS sessions' }
                ]
            },
            {
                step: 'action',
                title: 'Take Action (T) - Lock Containment',
                narration: 'IAM Key deactivated within 90 seconds. CloudTrail audit initiated. Containment verified before moving on to secondary tasks.',
                actions: [
                    { taskId: 's4-t1', actionStatus: 'action_now' },
                    { taskId: 's4-t2', actionStatus: 'deferred' },
                    { taskId: 's4-t3', actionStatus: 'deferred' },
                    { taskId: 's4-t4', actionStatus: 'deferred' },
                    { taskId: 's4-t5', actionStatus: 'deferred' }
                ]
            }
        ],
        quiz: {
            surveyQuestion: {
                prompt: 'Step 1 (Survey): Which single alert must be designated as PRIMARY?',
                correctPrimaryIds: ['s4-t1'],
                correctSecondaryIds: ['s4-t2', 's4-t3', 's4-t4', 's4-t5'],
                feedbackCorrect: '✅ Correct! An exposed production IAM credential is an existential security threat demanding immediate containment.',
                feedbackWrong: '⚠️ Exposed root/IAM secrets always take precedence over CI timeouts, DNS warnings, or doc reports.'
            },
            prioritizeQuestion: {
                prompt: 'Step 2 (Prioritize): Why is the exposed secret key high urgency?',
                correctHighUrgencyIds: ['s4-t1'],
                feedbackCorrect: '✅ Exactly. Automated credential scrapers scan GitHub in seconds to compromise cloud infrastructure.',
                feedbackWrong: '⚠️ Credential exposure has zero tolerance delay.'
            },
            optimizeQuestion: {
                prompt: 'Step 3 (Optimize): What is the most effective immediate mitigation step?',
                options: [
                    { id: 's4-opt1', text: 'Deactivate the IAM key directly in AWS IAM and revoke temporary STS sessions', correct: true, explanation: 'Stops the exploit immediately regardless of git repository state.' },
                    { id: 's4-opt2', text: 'Force push to delete the commit from the GitHub repository', correct: false, explanation: 'Does NOT invalidate the key; scrapers already harvested it!' },
                    { id: 's4-opt3', text: 'Email the developer asking them why they committed the key', correct: false, explanation: 'Wastes critical containment time.' }
                ],
                feedbackCorrect: '✅ Perfect! Invalidate the credential first; post-mortem and git cleaning happen second.',
                feedbackWrong: '⚠️ Deleting git commits does NOT invalidate a leaked key that may already be captured by scrapers.'
            },
            actionQuestion: {
                prompt: 'Step 4 (Take Action): What is the next immediate step after IAM key deactivation?',
                options: [
                    { id: 's4-act1', text: 'Check CloudTrail logs for unauthorized API calls and generate new credentials', correct: true, explanation: 'Audits potential breach impact and securely restores service.' },
                    { id: 's4-act2', text: 'Fix the documentation typo reported in ticket #5', correct: false, explanation: 'Security audit must precede minor doc fixes.' }
                ],
                feedbackCorrect: '✅ Excellent! Security audit and key rotation complete the containment cycle.',
                feedbackWrong: '⚠️ Security containment requires auditing logs for unauthorized access before handling secondary chores.'
            },
            keyTakeaway: 'SPOT enforces immediate, decisive containment of high-blast-radius security exposures before routine CI or documentation issues.'
        }
    }
];
