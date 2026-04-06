import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Notify Radarr or Sonarr',
  description: 'Notify Radarr or Sonarr to refresh after file change. '
    + 'Has to be used after the "Set Flow Variables From Radarr Or Sonarr" plugin.',
  style: {
    borderColor: 'green',
  },
  tags: '',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faBell',
  inputs: [
    {
      label: 'Arr',
      name: 'arr',
      type: 'string',
      defaultValue: 'radarr',
      inputUI: {
        type: 'dropdown',
        options: ['radarr', 'sonarr'],
      },
      tooltip: 'Specify which arr to use',
    },
    {
      label: 'Arr API Key',
      name: 'arr_api_key',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr api key here',
    },
    {
      label: 'Arr Host',
      name: 'arr_host',
      type: 'string',
      defaultValue: 'http://192.168.1.1:7878',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Input your arr host here.\nExample:\n'
        + 'http://192.168.1.1:7878\n'
        + 'http://192.168.1.1:8989\n'
        + 'https://radarr.domain.com\n'
        + 'https://sonarr.domain.com',
    },
    {
      label: 'Auto Rename',
      name: 'autoRename',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Automatically trigger a rename based on the naming convention. '
        + 'If nothing needs to be renamed, it will report success.',
    },
  ],
  outputs: [
    { number: 1, tooltip: 'Radarr or Sonarr notified and renamed if needed' },
    { number: 2, tooltip: 'Radarr or Sonarr do not know this file' },
  ],
});

interface IHTTPHeaders {
  'Content-Type': string;
  'X-Api-Key': string;
  Accept: string;
}

interface IArrApp {
  name: string;
  host: string;
  headers: IHTTPHeaders;
  content: string;
  buildRefreshRequest: (id: number) => string;
  buildRenameRequest: (id: number, fileId: number) => string;
}

const API_VERSION = 'v3';
const CONTENT_TYPE = 'application/json';

const arrConfigs = {
  radarr: {
    content: 'Movie',
    buildRefreshRequest: (id: number) => JSON.stringify({ name: 'RefreshMovie', movieIds: [id] }),
    buildRenameRequest: (id: number, fileId: number) => JSON.stringify({
      name: 'renameMovieFiles',
      movieId: id,
      files: [fileId],
    }),
  },
  sonarr: {
    content: 'Serie',
    buildRefreshRequest: (id: number) => JSON.stringify({ name: 'RefreshSeries', seriesId: id }),
    buildRenameRequest: (id: number, _fileId: number) => JSON.stringify({
      name: 'RenameSeries',
      seriesId: id,
    }),
  },
} as const;

const normalizeHost = (host: string): string => {
  const trimmedHost = host.trim();
  return trimmedHost.endsWith('/') ? trimmedHost.slice(0, -1) : trimmedHost;
};

const createArrApp = (
  arrType: 'radarr' | 'sonarr',
  host: string,
  apiKey: string,
): IArrApp => {
  const headers: IHTTPHeaders = {
    'Content-Type': CONTENT_TYPE,
    'X-Api-Key': apiKey,
    Accept: CONTENT_TYPE,
  };

  const config = arrConfigs[arrType];

  return {
    name: arrType,
    host: normalizeHost(host),
    headers,
    content: config.content,
    buildRefreshRequest: config.buildRefreshRequest,
    buildRenameRequest: config.buildRenameRequest,
  };
};

const refreshArr = async (
  arrApp: IArrApp,
  id: number,
  args: IpluginInputArgs,
): Promise<boolean> => {
  if (id === -1) {
    args.jobLog('No valid ID found in variables');
    return false;
  }

  try {
    await args.deps.axios({
      method: 'post',
      url: `${arrApp.host}/api/${API_VERSION}/command`,
      headers: arrApp.headers,
      data: arrApp.buildRefreshRequest(id),
    });

    args.jobLog(`✔ ${arrApp.content} '${id}' refreshed in ${arrApp.name}.`);
    return true;
  } catch (error) {
    args.jobLog(`Error refreshing ${arrApp.name}: ${(error as Error).message}`);
    return false;
  }
};

const renameArr = async (
  arrApp: IArrApp,
  id: number,
  args: IpluginInputArgs,
): Promise<boolean> => {
  try {
    // For Radarr, fetch movie details to get the file ID, then use renameMovieFiles
    if (arrApp.name === 'radarr') {
      const movieResponse = await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/movie/${id}`,
        headers: arrApp.headers,
      });
      const movieData = movieResponse.data;

      if (!movieData?.movieFile?.id) {
        args.jobLog('No movie file found for this movie, skipping rename');
        return false;
      }

      const fileId = movieData.movieFile.id;
      args.jobLog(`Found movie file ID: ${fileId}`);

      // Use renameMovieFiles command with specific file ID
      await args.deps.axios({
        method: 'post',
        url: `${arrApp.host}/api/v3/command`,
        headers: arrApp.headers,
        data: JSON.stringify({
          name: 'renameMovieFiles',
          movieId: id,
          files: [fileId],
        }),
      });

      args.jobLog(`✔ Rename command sent to ${arrApp.name} for movie ID ${id}, file ${fileId}.`);
      return true;
    }

    // For Sonarr, use the /api/rename endpoint to get rename preview, then trigger rename
    if (arrApp.name === 'sonarr') {
      await args.deps.axios({
        method: 'get',
        url: `${arrApp.host}/api/v3/rename?seriesId=${id}`,
        headers: arrApp.headers,
      });

      await args.deps.axios({
        method: 'post',
        url: `${arrApp.host}/api/v3/command`,
        headers: arrApp.headers,
        data: JSON.stringify({ name: 'RenameSeries', seriesId: id }),
      });

      args.jobLog(`✔ Rename command sent to ${arrApp.name} for series ID ${id}.`);
      return true;
    }

    args.jobLog(`Unknown arr type: ${arrApp.name}`);
    return false;
  } catch (error) {
    args.jobLog(`Error triggering rename in ${arrApp.name}: ${(error as Error).message}`);
    return false;
  }
};

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { arr, arr_api_key, arr_host, autoRename } = args.inputs as {
    arr: 'radarr' | 'sonarr';
    arr_api_key: string;
    arr_host: string;
    autoRename: boolean;
  };
  const arrApp = createArrApp(arr, arr_host, arr_api_key);

  args.jobLog('Going to force scan');
  args.jobLog(`Refreshing ${arrApp.name}...`);

  const id = Number(args.variables.user.ArrId ?? -1);
  args.jobLog(`ArrId ${id} read from flow variables`);
  const refreshed = await refreshArr(arrApp, id, args);

  // Wait for Radarr to complete the refresh before triggering rename
  // This is needed because the refresh is asynchronous in Radarr
  if (autoRename && refreshed) {
    args.jobLog('Waiting for refresh to complete...');
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
    args.jobLog('Auto Rename enabled, triggering rename...');
    await renameArr(arrApp, id, args);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: refreshed ? 1 : 2,
    variables: args.variables,
  };
};

export { details, plugin };