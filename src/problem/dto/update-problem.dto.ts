import { OmitType} from '@nestjs/mapped-types';
import { CreateProblemDto } from './create-problem.dto';

export class UpdateProblemDto extends OmitType(CreateProblemDto, ['contestId']) {}
