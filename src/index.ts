import axios from "axios";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";

const app = new Hono();

type Environment = {
  GITHUB_TOKEN: string;
};

app.use("*", cors());

app.get("/", async (c) => {
  return c.text(
    "Welcome to the GitHub Info API!\n\n" +
      "Available Endpoints:\n" +
      "1. /github/:username - Retrieve basic information about a GitHub user.\n" +
      "2. /github/:username/contributions - Retrieve contribution details for a GitHub user.\n\n" +
      "Replace ':username' with the GitHub username you want to query."
  );
});

app.get("/github/:username", async (c) => {
  const { username } = c.req.param();

  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          "User-Agent": "github-api/1.0.0", // Github requires this for the req 
        },
      }
    );

    return c.json(response.data);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch GitHub user data" }, 500);
  }
});

app.get("/github/:username/contributions", async (c) => {
  const { username } = c.req.param();

  const { GITHUB_TOKEN } = env<Environment>(c);

  const query = `
  {
    user(login: "${username}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              weekday
              date
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "User-Agent": "github-api/1.0.0",
        },
      }
    );

    const contributions =
      response.data.data.user.contributionsCollection.contributionCalendar;
    return c.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
  }
});

export default app;
