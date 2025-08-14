import React from 'react';
import ResourceDisplay from '../tasks/ResourceDisplay.jsx';

const ResourceTest = () => {
  // Sample test resources
  const testResources = [
    {
      type: "documentation",
      title: "React Official Documentation",
      url: "https://reactjs.org/docs/getting-started.html",
      description: "Official React documentation for getting started"
    },
    {
      type: "video",
      title: "React Tutorial for Beginners",
      url: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
      description: "Comprehensive React tutorial"
    },
    {
      type: "article",
      title: "Modern React Best Practices",
      url: "https://blog.logrocket.com/modern-react-best-practices/",
      description: "Best practices for modern React development"
    },
    {
      type: "project",
      title: "React Examples Repository",
      url: "https://github.com/facebook/react/tree/main/packages/react-dom/src/__tests__",
      description: "Example React projects and code samples"
    }
  ];

  const emptyResources = [];
  const invalidResources = [
    {
      type: "article",
      title: "Test Resource",
      url: "resource url"
    },
    {
      type: "video",
      title: "Another Test",
      url: "https://actual-working-url.com"
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Resource Display Test
      </h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Valid Resources (Light Theme)
          </h3>
          <div className="border border-gray-200 p-4 rounded">
            <ResourceDisplay resources={testResources} theme="light" />
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-white">
            Valid Resources (Dark Theme)
          </h3>
          <ResourceDisplay resources={testResources} theme="dark" />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Empty Resources
          </h3>
          <div className="border border-gray-200 p-4 rounded">
            <ResourceDisplay resources={emptyResources} />
            <p className="text-gray-500 text-sm mt-2">
              {emptyResources.length === 0 ? "No resources to display (component returns null)" : "Resources found"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Invalid/Placeholder Resources
          </h3>
          <div className="border border-gray-200 p-4 rounded">
            <ResourceDisplay resources={invalidResources} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceTest;