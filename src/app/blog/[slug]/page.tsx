import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import Heading1 from "../../components/Heading-1";
import { parseISO, format } from "date-fns";
import { Image } from "@nextui-org/image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";

// Define the types for your data
interface Post {
  fields: {
    slug: string;
    title: string;
    content: any;
    publishedDate: string;
    featuredImage: {
      sys: {
        id: string;
      };
    };
  };
}

interface PostsResponse {
  items: Post[];
  includes: {
    Asset: {
      sys: {
        id: string;
      };
      fields: {
        file: {
          url: string;
        };
      };
    }[];
  };
}

function Date(dateString: string) {
  const date = parseISO(dateString);
  return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>;
}

function getImage(posts: PostsResponse, post: Post) {
  const assetId = post.fields.featuredImage.sys.id;
  const asset = posts.includes.Asset.find((a: any) => a.sys.id === assetId);
  return asset ? `https:${asset.fields.file.url}` : "/marcel.png";
}
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  // Get the slug from the dynamic route parameter
  const { slug } = params;

  const data = await fetch(
    `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT}/entries?content_type=pageBlogPost&include=1&fields.slug=${slug}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
      },
    }
  );

  const posts: PostsResponse = await data.json();

  // Check if the post exists
  const post = posts.items[0];

  if (!post) {
    notFound(); // This will render the 404 page if the post isn't found
  }

  const content = post.fields.content;

  // Define the custom renderer for the rich text content
  const options = {
    renderNode: {
      "embedded-entry-block": (node: any) => {
        return null; // Handle embedded entries here if necessary
      },
      "embedded-asset-block": (node: any) => {
        return null; // Handle embedded assets here if necessary
      },
      paragraph: (node: any) => {
        return (
          <p className="mb-4">
            {node.content.map((item: any) => item.value).join(" ")}
          </p>
        );
      },
      hyperlink: (node: any) => {
        const { uri } = node.data; // Get the URL from the hyperlink node
        return (
          <a href={uri} target="_blank" rel="noopener noreferrer">
            {node.content[0].value}
          </a>
        );
      },
    },
  };
  let renderedContent;

  // Check if the content is a rich text Document (it should have nodeType)
  if (content && content.nodeType) {
    renderedContent = documentToReactComponents(content);
  } else if (typeof content === "string") {
    // If it's a string (HTML content), render it directly
    renderedContent = <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className="container mx-auto px-8 max-w-2xl md:max-w-4xl my-8">
      <Card className="h-full">
        <CardHeader>
          <Heading1 text={post.fields.title} />
        </CardHeader>
        <CardBody className="h-full">
          <Image
            src={getImage(posts, post)}
            width={800}
            height={400}
            alt={post.fields.title}
            className="mb-4"
          />
          <p className="text-default-500 mb-4">
            {Date(post.fields.publishedDate)}
          </p>
          {renderedContent}
        </CardBody>
      </Card>
    </div>
  );
}