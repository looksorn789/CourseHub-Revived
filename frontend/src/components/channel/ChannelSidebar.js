import { Card, CardContent, CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import { Users } from 'lucide-react';

export function ChannelSidebar({ channelData }) {
  if (!channelData) {
    return null;
  }

  const {
    description = "",
    member_count = 0,
    tags = [],
    rules = []
  } = channelData;
   return (
    <div className="w-80 space-y-6">
      <Card className="bg-white shadow-md rounded-xl overflow-hidden border-none">
        <CardHeader>
          <h3 className="text-xl font-semibold text-green-700">About</h3>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-gray-700 mb-4">{description}</p>
          )}
          <div className="flex items-center space-x-2 text-base text-gray-700 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            <span>
              {typeof member_count === 'number' 
                ? `${member_count.toLocaleString()} members`
                : '0 members'
              }
            </span>
          </div>
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Array.isArray(rules) && rules.length > 0 && (
        <Card className="bg-white shadow-md rounded-xl overflow-hidden border-none">
          <CardHeader>
            <h3 className="text-xl font-semibold text-green-700">Channel Rules</h3>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {rules.map((rule, index) => (
                <li key={index} className="text-gray-700">{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}