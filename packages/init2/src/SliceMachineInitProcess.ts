import chalk from "chalk";
import { ExecaChildProcess } from "execa";
import logSymbols from "log-symbols";

import {
	createSliceMachineManager,
	PrismicUserProfile,
	PrismicRepository,
	SliceMachineManager,
} from "@slicemachine/core2";

import * as framework from "./framework";
import { listr, listrRun } from "./lib/listr";
import * as packageManager from "./lib/packageManager";
import { prompt } from "./lib/prompt";
import * as repositoryDomain from "./lib/repositoryDomain";

export type SliceMachineInitProcessOptions = {
	input: string[];
	repository?: string;
} & Record<string, unknown>;

export const createSliceMachineInitProcess = (
	options: SliceMachineInitProcessOptions
): SliceMachineInitProcess => {
	return new SliceMachineInitProcess(options);
};

export class SliceMachineInitProcess {
	protected options: SliceMachineInitProcessOptions;
	protected manager: SliceMachineManager;

	protected context: {
		framework?: framework.Framework;
		packageManager?: packageManager.Agent;
		installProcess?: ExecaChildProcess;
		userProfile?: PrismicUserProfile;
		userRepositories?: PrismicRepository[];
		repository?: {
			domain: string;
			exists: boolean;
		};
	};

	constructor(options: SliceMachineInitProcessOptions) {
		this.options = options;
		this.manager = createSliceMachineManager();

		this.context = {};
	}

	async run(): Promise<void> {
		await listrRun([
			{
				title: "Detecting environment...",
				task: (_, parentTask) =>
					listr([
						{
							title: "Detecting framework...",
							task: async (_, task) => {
								this.context.framework = await framework.detect();

								task.title = `Detected framework ${chalk.cyan(
									this.context.framework.name
								)}`;
							},
						},
						{
							title: "Detecting package manager...",
							task: async (_, task) => {
								this.context.packageManager = await packageManager.detect();

								task.title = `Detected package manager ${chalk.cyan(
									this.context.packageManager
								)}`;

								parentTask.title = `Detected framework ${chalk.cyan(
									this.context.framework?.name
								)} and package manager ${chalk.cyan(
									this.context.packageManager
								)}`;
							},
						},
					]),
			},
		]);

		await listrRun([
			{
				title: "Beginning core dependencies installation...",
				task: async (_, task) => {
					const { execaProcess } = await packageManager.install({
						// TODO: Assert types
						agent: this.context.packageManager!,
						dependencies: this.context.framework!.devDependencies,
						dev: true,
					});

					// Fail hard if process fails
					execaProcess.catch((error) => {
						const [_, ...argv1n] = process.argv;
						// Command the user used
						let tryAgainCommand = [process.argv0, ...argv1n].join(" ");

						setTimeout(() => {
							// If the `repository` option wasn't used AND the repository was selected/created
							if (!this.options.repository && this.context.repository) {
								tryAgainCommand = `${tryAgainCommand} --repository=${
									this.context.repository!.domain
								}`;
							}
							console.error(
								`\n\n${error.shortMessage}\n${error.stderr}\n\n${
									logSymbols.error
								} Dependency installation failed, try again with:\n\n  ${chalk.gray(
									"$"
								)} ${chalk.cyan(tryAgainCommand)}`
							);

							process.exit(1);
						}, 4000);
					});

					this.context.installProcess = execaProcess;

					task.title = `Began core dependencies installation with ${chalk.cyan(
						this.context.packageManager
					)} ... (running in background)`;
				},
			},
		]);

		await listrRun([
			{
				title: "Logging in to Prismic...",
				task: async (_, parentTask) => {
					try {
						parentTask.output = "Validating session...";
						this.context.userProfile = await this.manager.user.getProfile();

						parentTask.title = `Logged in as ${chalk.cyan(
							this.context.userProfile?.email
						)}`;
						parentTask.output = "";
					} catch {
						// noop
					}

					if (!this.context.userProfile) {
						parentTask.output = "Press any key to open the browser to login...";
						await new Promise((resolve) => {
							const initialRawMode = process.stdin.isRaw;
							process.stdin.setRawMode(true);
							process.stdin.once("data", (data: Buffer) => {
								process.stdin.setRawMode(initialRawMode);
								process.stdin.pause();
								resolve(data.toString("utf-8"));
							});
						});

						parentTask.output = "Browser opened, waiting for you to login...";
						await this.manager.user.browserLogin();

						parentTask.title = `Logged in`;
					}

					return listr(
						[
							{
								title: "Fetching user profile...",
								task: async (_, task) => {
									if (!this.context.userProfile) {
										this.context.userProfile =
											await this.manager.user.getProfile();
									}

									parentTask.title = `Logged in as ${chalk.cyan(
										this.context.userProfile?.email
									)}`;
									task.title = "Fetched user profile";
								},
							},
							{
								title: "Fetching user repositories...",
								task: async (_, task) => {
									this.context.userRepositories =
										await this.manager.repository.readAll();

									task.title = "Fetched user repositories";
								},
							},
						],
						{ concurrent: true }
					);
				},
			},
		]);

		if (this.options.repository) {
			await listrRun([
				{
					title: `Options ${chalk.cyan(
						"repository"
					)} used, validating input...`,
					task: async (_, task) => {
						// TODO: Assert types
						const maybeRepository = this.context.userRepositories!.find(
							(repository) => repository.domain === this.options.repository
						);

						if (maybeRepository) {
							if (!this.manager.repository.hasWriteAccess(maybeRepository)) {
								throw new Error(
									`Cannot run init command with repository ${chalk.cyan(
										maybeRepository.domain
									)}: you are not a developer or admin of this repository`
								);
							}
						} else if (
							await this.manager.repository.exists({
								domain: this.options.repository!,
							})
						) {
							throw new Error(
								`Repository name ${chalk.cyan(
									this.options.repository
								)} is already taken`
							);
						}

						task.title = `Selected repository ${chalk.cyan(
							this.options.repository
						)} (options ${chalk.cyan("repository")} used)`;

						this.context.repository = {
							domain: this.options.repository!,
							exists: !!maybeRepository,
						};
					},
				},
			]);
		} else {
			if (this.context.userRepositories!.length) {
				const { maybeDomain } = await prompt<string, "maybeDomain">({
					type: "select",
					name: "maybeDomain",
					message:
						"Pick a repository to connect to or choose to create a new one",
					warn: "You are not a developer or admin of this repository",
					choices: [
						{
							title: "CREATE NEW",
							description: "Create a new Prismic repository\n",
							value: "",
						},
						...this.context
							.userRepositories!.map((repository) => {
								const hasWriteAccess =
									this.manager.repository.hasWriteAccess(repository);

								return {
									title: `${repository.domain}${
										hasWriteAccess ? "" : " (Unauthorized)"
									}`,
									description: `Connect to ${chalk.cyan(repository.domain)}`,
									value: repository.domain,
									disabled: !hasWriteAccess,
								};
							})
							.sort((a, b) => (a.value > b.value ? 1 : -1)),
					],
				});

				if (maybeDomain) {
					this.context.repository = {
						domain: maybeDomain,
						exists: true,
					};
				}
			}

			if (!this.context.repository) {
				let suggestedName = repositoryDomain.random();
				while (
					await this.manager.repository.exists({ domain: suggestedName })
				) {
					suggestedName = repositoryDomain.random();
				}

				// TODO: Prompt for repository
				const { domain } = await prompt<string, "domain">({
					type: "text",
					name: "domain",
					// Overriden by the `onRender` function, just used as a fallback
					message: "Choose a name for your Prismic repository",
					initial: suggestedName,
					onRender() {
						const raw = this.value || this.initial || "";
						const domain = repositoryDomain.format(raw);

						const validation = repositoryDomain.validate(domain);

						this.msg = chalk.reset(
							`
Choose a name for your Prismic repository

  NAMING RULES
${chalk[validation.NonLetterStart ? "red" : "gray"](
	`    1. Name should ${chalk[validation.NonLetterStart ? "bold" : "cyan"](
		"start with a letter"
	)}`
)}
${chalk[validation.LessThan4 ? "red" : "gray"](
	`    2. Name should be ${chalk[validation.LessThan4 ? "bold" : "cyan"](
		"4 characters long or more"
	)}`
)}
${chalk[validation.MoreThan30 ? "red" : "gray"](
	`    3. Name should be ${chalk[validation.MoreThan30 ? "bold" : "cyan"](
		"30 characters long or less"
	)}`
)}
${chalk.gray(`    4. Name will be ${chalk.cyan("kebab-cased")} automatically`)}

  CONSIDERATIONS
${chalk.gray(
	`    1. Once picked, your repository name ${chalk.cyan("cannot be changed")}`
)}
${chalk.gray(
	`    2. A ${chalk.cyan(
		"display name"
	)} for the repository can be configured later on`
)}

  PREVIEW
${chalk.gray(`    Dashboard  ${chalk.cyan(`https://${domain}.prismic.io`)}`)}
${chalk.gray(
	`    API        ${chalk.cyan(`https://${domain}.cdn.prismic.io/api/v2`)}`
)}

${chalk.cyan("?")} Your Prismic repository name`.replace("\n", "")
						);
					},
					validate: async (rawDomain: string) => {
						const validation = repositoryDomain.validate(rawDomain);
						if (validation.hasErrors) {
							const formattedErrors: string[] = [];

							if (validation.NonLetterStart) {
								formattedErrors.push("must start with a letter");
							}
							if (validation.LessThan4) {
								formattedErrors.push("cannot be less than 4 characters long");
							}
							if (validation.MoreThan30) {
								formattedErrors.push("cannot be more than 30 characters long");
							}

							return `Name ${formattedErrors.join(" and ")}`;
						}

						const domain = repositoryDomain.format(rawDomain);
						const exists = await this.manager.repository.exists({ domain });
						if (exists) {
							return `Repository name ${chalk.cyan(domain)} is already taken`;
						}

						return true;
					},
					format: (value) => {
						return repositoryDomain.format(value);
					},
				});

				// Clear extra lines
				process.stdout.moveCursor(0, -16);
				process.stdout.clearScreenDown();

				this.context.repository = {
					domain,
					exists: false,
				};
			}

			console.log(
				`${logSymbols.success} Selected repository ${chalk.cyan(
					this.context.repository!.domain
				)}`
			);
		}

		if (!this.context.repository!.exists) {
			await listrRun([
				{
					title: `Creating new repository ${chalk.cyan(
						this.context.repository!.domain
					)} ...`,
					task: async (_, task) => {
						await this.manager.repository.create({
							domain: this.context.repository!.domain,
							framework: this.context.framework!.prismicName,
						});

						this.context.repository!.exists = true;
						task.title = `Created new repository ${chalk.cyan(
							this.context.repository!.domain
						)}`;
					},
				},
			]);
		}

		await listrRun([
			{
				title: `Finishing core dependencies installation with ${chalk.cyan(
					this.context.packageManager
				)} ...`,
				task: async (_, task) => {
					const updateOutput = (data: Buffer | null) => {
						if (data instanceof Buffer) {
							task.output = data.toString();
						}
					};
					// TODO: Assert types
					this.context.installProcess!.stdout?.on("data", updateOutput);
					this.context.installProcess!.stderr?.on("data", updateOutput);

					try {
						await this.context.installProcess;
					} catch {
						// Noop, error catching happens when then process is started ealier
					}

					task.title = `Core dependencies installed with ${chalk.cyan(
						this.context.packageManager
					)}`;
				},
			},
		]);

		await listrRun([
			{
				title: "Finishing Slice Machine installation",
				task: (_, _parentTask) =>
					listr([
						{
							title: "Project setup",
							task: () => new Promise((res) => setTimeout(res, 2000)),
						},
						{
							title: `${chalk.cyan(
								this.context.framework?.name
							)} adapter setup`,
							task: () => new Promise((res) => setTimeout(res, 2000)),
						},
					]),
			},
		]);
	}
}
