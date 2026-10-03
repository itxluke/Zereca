import {Vector3} from 'three';
/** The repaired GLB has the actual hand-parented letter, upper thread and ribbon. */
export const invitationUsesNativeThread=true;
export function createInvitationAnchors(){return{hand:new Vector3(),letter:new Vector3()};}
