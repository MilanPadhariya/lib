import {processArgs} from "./generate-model-meta";
import {CliArgs} from '../cli-args';

const args=new CliArgs(__filename);
processArgs(args);
