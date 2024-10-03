import {api} from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import yargs from 'yargs/yargs';

dotenv.config();

interface Environment {
    API_TOKEN: string;
}

function sanitiseEnvVariable(envVars: NodeJS.ProcessEnv): Environment {
    if (!envVars.API_TOKEN){
        throw new Error("API_TOKEN not defined");
    }
    return {
        API_TOKEN: envVars.API_TOKEN,
    };
}

const sanitisedEnvVars: Environment = sanitiseEnvVariable(process.env);

const argv = yargs(process.argv.slice(2))
    .scriptName("calc-ooh-pay")
    .usage('$0 [options]')
    .options({
        r: { type: 'string', demandOption: true, alias: 'rotaId(s)', description: '1 scheduleId or multiple scheduleIds separated by comma' },
        s: { type: 'string', demandOption: true, alias: 'since', description: 'start of the schedule period' },
        u: { type: 'string', demandOption: true, alias: 'until', description: 'end of the schedule period' },
        k: { type: 'string', demandOption: false, alias: 'key', description: 'this command line argument API_TOKEN to override environment variable API_TOKEN' },
        o: { type: 'string', demandOption: false, alias: 'output-file', description: 'the path to the file where you want the on-call payments table printed' },
    })
    .help()
    .parse();

const pd = api({token: sanitisedEnvVars.API_TOKEN});

