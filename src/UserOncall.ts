import { User } from './User';


export interface UserOncall {
    start: Date;
    end: Date;
    user?: User;
}
