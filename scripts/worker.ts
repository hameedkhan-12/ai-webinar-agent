import 'dotenv/config'

import { startCallProcessingWorker } from '@/lib/queues/callProcessingWorker'

startCallProcessingWorker()
