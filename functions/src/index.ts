import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import * as serviceAccount from './hive-engine-firebase-adminsdk.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: "https://tribaldex-d22e0.firebaseio.com"
});

import { authRouter } from './routes/auth';

const app = express();

app.disable('x-powered-by');

app.use(cors({ origin: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const cacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    next();
};

app.use(cacheMiddleware);
//app.use(authMiddleware);

app.use('/', authRouter);

export const createUserRoles = functions.auth.user().onCreate((user) => {
    const customClaims: any = {
        member: true
    };

    const adminUsers = ['yabapmatt', 'aggroed', 'beggars', 'lion200'];

    if (adminUsers.includes(user.uid)) {
        customClaims.admin = true;
        customClaims.super = true;
    }

    return admin.auth().setCustomUserClaims(user.uid, customClaims);
});

export const updateUserClaimsOnRoleChange = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
    const data = change.after.data();

    const customClaims = {} as any;

    const authUser = await admin.auth().getUser(context.params.userId);
    const loadedCustomClaims = authUser.customClaims as Record<string, any>;

    // Only apply claims if user is not a super admin (super admins cannot be changed programmatically)
    if (authUser && !loadedCustomClaims?.super) {
        console.log('Attempting to change user roles (if needed).', authUser.uid, authUser.customClaims);

        // Clear all claims
        await admin.auth().setCustomUserClaims(authUser.uid, null);

        if (data?.admin) {
            customClaims.admin = true;
        }

        if (data?.kycAuditor) {
            customClaims.kycAuditor = true;
        }
        
        await admin.auth().setCustomUserClaims(authUser.uid, customClaims);
    } else {
        console.log('Super user cannot change roles.', authUser.uid, authUser.customClaims);
    }
});

export const auditAdminChanges = functions.firestore.document('admin/settings').onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();

    if (after) {
        const updatedBy = after.updatedBy;

        try {
            const ref = admin.firestore().collection('audit').doc();
            const id = ref.id;
            const createdAt = Date.now();
            const data = {updatedBy, before, after, id, createdAt, type: 'adminSettings'};

            await ref.set(data)
        } catch (e) {
            console.error('Error adding audit change', e);
        }
    }
});

export const api = functions
    .runWith({ memory: '1GB', timeoutSeconds: 120 })
    .https
    .onRequest(app);
