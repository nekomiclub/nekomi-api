import MongoDBService from './_core/Services/DatabaseService';
import log from './_core/Services/LoggerService';



//* === Clear up console
console.clear();
log.debug(`[System/Init]: ------------------ DRY RUN ------------------`);



//* === Establish mongodb connection
MongoDBService.connect();