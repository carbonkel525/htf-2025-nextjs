"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchFishes } from "@/api/fish"
import { Fish } from "@/types/fish"

// Fish creation schema
const fishFormSchema = z.object({
  name: z.string().min(2, {
    message: "Fish name must be at least 2 characters.",
  }),
  image: z.string().optional(),
  rarity: z.string().min(1, {
    message: "Please select a rarity.",
  }).refine(
    (val) => val === "COMMON" || val === "RARE" || val === "EPIC",
    { message: "Please select a valid rarity: COMMON, RARE, or EPIC" }
  ),
})

// Sighting creation schema
const sightingFormSchema = z.object({
  fishId: z.string().min(1, {
    message: "Please select a fish.",
  }),
  latitude: z.number().min(-90, {
    message: "Latitude must be between -90 and 90",
  }).max(90, {
    message: "Latitude must be between -90 and 90",
  }),
  longitude: z.number().min(-180, {
    message: "Longitude must be between -180 and 180",
  }).max(180, {
    message: "Longitude must be between -180 and 180",
  }),
  timestamp: z.string().min(1, {
    message: "Timestamp is required",
  }),
})

const API_BASE_URL = "http://localhost:5555/api";

export function FishForm() {
  const router = useRouter();
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [loadingFishes, setLoadingFishes] = useState(true);
  const [fishSubmitting, setFishSubmitting] = useState(false);
  const [sightingSubmitting, setSightingSubmitting] = useState(false);
  const [fishError, setFishError] = useState<string | null>(null);
  const [sightingError, setSightingError] = useState<string | null>(null);
  const [fishSuccess, setFishSuccess] = useState<string | null>(null);
  const [sightingSuccess, setSightingSuccess] = useState<string | null>(null);

  // Fish form
  const fishForm = useForm<z.infer<typeof fishFormSchema>>({
    resolver: zodResolver(fishFormSchema),
    defaultValues: {
      name: "",
      image: "",
      rarity: "",
    },
  })

  // Sighting form
  const sightingForm = useForm<z.infer<typeof sightingFormSchema>>({
    resolver: zodResolver(sightingFormSchema),
    defaultValues: {
      fishId: "",
      latitude: 0,
      longitude: 0,
      timestamp: new Date().toISOString().slice(0, 16),
    },
  })

  // Fetch fishes for dropdown
  useEffect(() => {
    const loadFishes = async () => {
      try {
        setLoadingFishes(true);
        const fetchedFishes = await fetchFishes();
        setFishes(fetchedFishes);
      } catch (error) {
        console.error("Error fetching fishes:", error);
        setSightingError("Failed to load fishes. Please refresh the page.");
      } finally {
        setLoadingFishes(false);
      }
    };
    loadFishes();
  }, []);

  // Submit fish creation
  const onFishSubmit = async (values: z.infer<typeof fishFormSchema>) => {
    try {
      setFishSubmitting(true);
      setFishError(null);
      setFishSuccess(null);

      const response = await fetch(`${API_BASE_URL}/fish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          image: values.image || undefined,
          rarity: values.rarity,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to create fish" }));
        throw new Error(error.error || "Failed to create fish");
      }

      const data = await response.json();
      console.log("Fish created successfully:", data);
      
      // Refresh fishes list
      const fetchedFishes = await fetchFishes();
      setFishes(fetchedFishes);
      
      setFishSuccess("Fish created successfully!");
      fishForm.reset();
      
      // Clear success message after 3 seconds
      setTimeout(() => setFishSuccess(null), 3000);
    } catch (error) {
      console.error("Error creating fish:", error);
      setFishError(error instanceof Error ? error.message : "Failed to create fish");
    } finally {
      setFishSubmitting(false);
    }
  };

  // Submit sighting creation
  const onSightingSubmit = async (values: z.infer<typeof sightingFormSchema>) => {
    try {
      setSightingSubmitting(true);
      setSightingError(null);
      setSightingSuccess(null);

      // Convert datetime-local format to ISO 8601 string for backend
      // datetime-local format: "2025-11-12T12:46" -> ISO: "2025-11-12T12:46:00.000Z"
      // Ensure we always send a valid ISO 8601 timestamp string
      let timestampISO: string;
      if (values.timestamp.includes('T') && !values.timestamp.includes('Z') && !values.timestamp.includes('+')) {
        // It's a datetime-local format, convert to ISO
        // Add seconds if missing, then convert to Date and back to ISO
        const dateStr = values.timestamp.length === 16 ? `${values.timestamp}:00` : values.timestamp;
        timestampISO = new Date(dateStr).toISOString();
      } else {
        // Already in ISO format or other valid format
        timestampISO = values.timestamp;
      }

      const requestBody = {
        fishId: values.fishId,
        latitude: values.latitude,
        longitude: values.longitude,
        timestamp: timestampISO,
      };

      console.log("Creating fish sighting with payload:", requestBody);

      // Use Next.js API route instead of external API directly
      const response = await fetch("/api/fish-sightings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create sighting";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Backend error response:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Sighting created successfully:", data);
      
      setSightingSuccess("Sighting created successfully!");
      sightingForm.reset({
        fishId: "",
        latitude: 0,
        longitude: 0,
        timestamp: new Date().toISOString().slice(0, 16),
      });
      
      // Refresh the page to update the overview with new sighting data
      router.refresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSightingSuccess(null), 3000);
    } catch (error) {
      console.error("Error creating sighting:", error);
      setSightingError(error instanceof Error ? error.message : "Failed to create sighting");
    } finally {
      setSightingSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)]">
      <div className="max-w-4xl mx-auto py-6 px-6 pb-12 space-y-6">
        {/* Header */}
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-4 rounded-lg">
          <h1 className="text-2xl font-bold [text-shadow:--shadow-glow-text] text-sonar-green font-mono">
            FISH MANAGEMENT SYSTEM
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            CREATE NEW FISH AND SIGHTINGS
          </p>
        </div>

        {/* Fish Creation Form */}
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit-border] backdrop-blur-[10px] rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-sonar-green font-mono mb-1">
              CREATE NEW FISH
            </h2>
            <p className="text-xs text-text-secondary font-mono">
              Add a new fish species to the database
            </p>
          </div>

          <Form {...fishForm}>
            <form onSubmit={fishForm.handleSubmit(onFishSubmit)} className="space-y-6">
              <FormField
                control={fishForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary font-mono text-sm">
                      Fish Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter fish name"
                        {...field}
                        className="bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary placeholder:text-text-secondary focus:border-sonar-green focus:ring-sonar-green/20"
                      />
                    </FormControl>
                    <FormMessage className="text-danger-red" />
                  </FormItem>
                )}
              />

              <FormField
                control={fishForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary font-mono text-sm">
                      Fish Image URL (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter image URL"
                        {...field}
                        className="bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary placeholder:text-text-secondary focus:border-sonar-green focus:ring-sonar-green/20"
                      />
                    </FormControl>
                    <FormMessage className="text-danger-red" />
                  </FormItem>
                )}
              />

              <FormField
                control={fishForm.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary font-mono text-sm">
                      Rarity
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value === "" ? undefined : field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary focus:border-sonar-green focus:ring-sonar-green/20">
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[color-mix(in_srgb,var(--color-dark-navy)_95%,transparent)] border-panel-border">
                        <SelectItem value="COMMON" className="text-text-primary focus:bg-sonar-green/20 focus:text-sonar-green">
                          COMMON
                        </SelectItem>
                        <SelectItem value="RARE" className="text-text-primary focus:bg-sonar-green/20 focus:text-sonar-green">
                          RARE
                        </SelectItem>
                        <SelectItem value="EPIC" className="text-text-primary focus:bg-sonar-green/20 focus:text-sonar-green">
                          EPIC
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-danger-red" />
                  </FormItem>
                )}
              />

              {fishError && (
                <div className="p-3 rounded-md bg-danger-red/20 border border-danger-red text-danger-red text-sm font-mono">
                  {fishError}
                </div>
              )}

              {fishSuccess && (
                <div className="p-3 rounded-md bg-sonar-green/20 border border-sonar-green text-sonar-green text-sm font-mono">
                  {fishSuccess}
                </div>
              )}

              <Button
                type="submit"
                disabled={fishSubmitting}
                className="w-full bg-sonar-green/20 border-2 border-sonar-green text-sonar-green hover:bg-sonar-green/30 font-mono font-bold shadow-[--shadow-cockpit-border] disabled:opacity-50"
              >
                {fishSubmitting ? "CREATING..." : "CREATE FISH"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Sighting Creation Form */}
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit-border] backdrop-blur-[10px] rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-sonar-green font-mono mb-1">
              CREATE NEW SIGHTING
            </h2>
            <p className="text-xs text-text-secondary font-mono">
              Add a new sighting for an existing fish
            </p>
          </div>

          <Form {...sightingForm}>
            <form onSubmit={sightingForm.handleSubmit(onSightingSubmit)} className="space-y-6">
              <FormField
                control={sightingForm.control}
                name="fishId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary font-mono text-sm">
                      Select Fish
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value === "" ? undefined : field.value}
                      disabled={loadingFishes}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary focus:border-sonar-green focus:ring-sonar-green/20">
                          <SelectValue placeholder={loadingFishes ? "Loading fishes..." : "Select a fish"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[color-mix(in_srgb,var(--color-dark-navy)_95%,transparent)] border-panel-border max-h-[300px]">
                        {fishes.map((fish) => (
                          <SelectItem
                            key={fish.id}
                            value={fish.id}
                            className="text-text-primary focus:bg-sonar-green/20 focus:text-sonar-green"
                          >
                            {fish.name} ({fish.rarity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-danger-red" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={sightingForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-primary font-mono text-sm">
                        Latitude
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          min={-90}
                          max={90}
                          placeholder="Latitude (-90 to 90)"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                          className="bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary placeholder:text-text-secondary focus:border-sonar-green focus:ring-sonar-green/20"
                        />
                      </FormControl>
                      <FormMessage className="text-danger-red" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sightingForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-primary font-mono text-sm">
                        Longitude
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          min={-180}
                          max={180}
                          placeholder="Longitude (-180 to 180)"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                          className="bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary placeholder:text-text-secondary focus:border-sonar-green focus:ring-sonar-green/20"
                        />
                      </FormControl>
                      <FormMessage className="text-danger-red" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sightingForm.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-primary font-mono text-sm">
                      Timestamp
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[color-mix(in_srgb,var(--color-dark-navy)_60%,transparent)] border-panel-border text-text-primary focus:border-sonar-green focus:ring-sonar-green/20"
                      />
                    </FormControl>
                    <FormMessage className="text-danger-red" />
                  </FormItem>
                )}
              />

              {sightingError && (
                <div className="p-3 rounded-md bg-danger-red/20 border border-danger-red text-danger-red text-sm font-mono">
                  {sightingError}
                </div>
              )}

              {sightingSuccess && (
                <div className="p-3 rounded-md bg-sonar-green/20 border border-sonar-green text-sonar-green text-sm font-mono">
                  {sightingSuccess}
                </div>
              )}

              <Button
                type="submit"
                disabled={sightingSubmitting || loadingFishes || fishes.length === 0}
                className="w-full bg-sonar-green/20 border-2 border-sonar-green text-sonar-green hover:bg-sonar-green/30 font-mono font-bold shadow-[--shadow-cockpit-border] disabled:opacity-50"
              >
                {sightingSubmitting ? "CREATING..." : "CREATE SIGHTING"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
