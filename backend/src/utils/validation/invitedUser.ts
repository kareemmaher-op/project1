export interface InviteMemberRequest {
	email?: string;
	emails?: string[];
}

export type ValidationErrors = Record<string, string>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function validateInviteMemberPayload(payload: InviteMemberRequest): Promise<ValidationErrors> {
	const errors: ValidationErrors = {};
	if (!payload) {
		errors.email = 'Email is required';
		return errors;
	}

	const hasSingle = typeof payload.email === 'string' && payload.email.trim().length > 0;
	const hasMany = Array.isArray(payload.emails) && payload.emails.length > 0;

	if (!hasSingle && !hasMany) {
		errors.email = 'Provide email or emails[]';
		return errors;
	}

	if (hasSingle && !emailRegex.test(payload.email as string)) {
		errors.email = 'Enter a valid email address';
	}

	if (hasMany) {
		const invalids = (payload.emails as string[]).filter(e => !emailRegex.test(e));
		if (invalids.length > 0) {
			errors.emails = `Invalid emails: ${invalids.join(', ')}`;
		}
	}

	return errors;
}