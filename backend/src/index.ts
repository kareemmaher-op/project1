import { app } from '@azure/functions';

// Modern Azure Functions v4 - organized in separate files
import './functions/index';

app.setup({
    enableHttpStream: true,
});